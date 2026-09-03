import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import type { ConsumerSession } from '@/apps/consumer/features/session/types';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { useConsumerOrderQaStore } from '@/apps/consumer/stores/consumerOrderQaStore';
import {
  isSameConsumerCartScope,
  useConsumerCartStore,
} from '@/apps/consumer/features/order-shell/stores/consumerCartStore';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { queryKeys } from '@/shared/api/queryKeys';
import { HttpError } from '@/shared/lib/httpClient';
import {
  useConsumerMenuDetailQuery,
  useConsumerMenuMainQuery,
  useConsumerMenuSearchQuery,
} from '../api/consumerMenuApi';
import { isTableInactiveError, useConsumerOrderCreateMutation } from '../api/consumerOrderApi';
import { calcCartLinePrice } from '../cartLine';
import type {
  OrderShellCartLine,
  OrderShellCartOption,
  OrderShellMenuGroup,
  OrderShellMenuItem,
} from '../types';

/**
 * 주문 제출 진행 단계.
 * API 오류 중 테이블 비활성은 장바구니 화면에서 처리하고, 나머지 전체 화면 상태만 관리한다.
 */
type OrderPhase =
  | 'idle'
  | 'processing'
  | 'complete'
  | 'error-network'
  | 'error-duplicate'
  | 'session-timeout'
  | 'session-closed'
  | 'network-error';

/**
 * ConsumerOrderPage의 메뉴/주문 흐름을 조립한다.
 * 장바구니는 Consumer 전용 store가 소유하고, 검색어/선택 카테고리/시트 열림 상태는
 * ConsumerHeader와 공유하는 각 store에서 읽는다.
 */
export function useConsumerOrderPage() {
  const searchQuery = useConsumerOrderFilterStore((state) => state.searchQuery);
  const setSearchQuery = useConsumerOrderFilterStore((state) => state.setSearchQuery);
  const selectedCategory = useConsumerOrderFilterStore((state) => state.selectedCategory);
  const storedCart = useConsumerCartStore((state) => state.cart);
  const cartScope = useConsumerCartStore((state) => state.scope);
  const bindCartScope = useConsumerCartStore((state) => state.bindScope);
  const addCartItem = useConsumerCartStore((state) => state.addItem);
  const updateLineQuantity = useConsumerCartStore((state) => state.updateLineQuantity);
  const removeLine = useConsumerCartStore((state) => state.removeLine);
  const clearCart = useConsumerCartStore((state) => state.clearCart);
  const getOrCreateClientRequestId = useConsumerCartStore(
    (state) => state.getOrCreateClientRequestId,
  );
  const [orderPhase, setOrderPhase] = useState<OrderPhase>('idle');
  const [duplicateTime, setDuplicateTime] = useState('');
  const queryClient = useQueryClient();
  const createOrder = useConsumerOrderCreateMutation();

  const { session } = useConsumerSession();
  const sessionId = session?.consumerSessionId ?? '';
  const nextCartScope = session
    ? {
        consumerSessionId: session.consumerSessionId,
        sysPlantCd: session.sysPlantCd,
        tableSysId: session.tableSysId,
      }
    : null;
  const cart =
    nextCartScope && isSameConsumerCartScope(cartScope, nextCartScope) ? storedCart : [];

  useEffect(() => {
    if (!session) return;
    bindCartScope({
      consumerSessionId: session.consumerSessionId,
      sysPlantCd: session.sysPlantCd,
      tableSysId: session.tableSysId,
    });
  }, [
    bindCartScope,
    session?.consumerSessionId,
    session?.sysPlantCd,
    session?.tableSysId,
    session,
  ]);
  const mainQuery = useConsumerMenuMainQuery(sessionId);
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);
  const isSearchDebouncing = searchQuery.trim() !== debouncedSearchQuery;
  const searchResult = useConsumerMenuSearchQuery(sessionId, debouncedSearchQuery);
  const [soldoutModalItems, setSoldoutModalItems] = useState<OrderShellCartLine[] | null>(null);
  // 품절 확인 모달에서 "확인"한 줄의 cartKey들 — 그 줄을 장바구니에서 지우기 전까지는 시트를
  // 닫았다 다시 열어도 품절 표기가 유지된다(레퍼런스는 시트를 닫으면 표기가 풀리지만,
  // 방금 품절이라고 안내받은 메뉴가 아무 일 없었다는 듯 되돌아가는 게 오히려 헷갈려서 바꿨다).
  const [soldoutCartKeys, setSoldoutCartKeys] = useState<Set<string>>(new Set());
  // 메뉴 목록·상세 시트에도 품절을 반영하기 위한 상태 — 장바구니와 달리 그 항목을 장바구니에서
  // 지워도 풀리지 않는다(가게에 실제로 없는 건 그대로다). 옵션 없이 담은 줄은 메뉴 자체가
  // 품절이라고 보고, 옵션을 골라 담은 줄은 그 옵션이 품절이라고 본다(메뉴 자체는 계속 주문 가능).
  const [soldoutMenuIds, setSoldoutMenuIds] = useState<Set<string>>(new Set());
  const [soldoutOptionChoiceIds, setSoldoutOptionChoiceIds] = useState<Set<string>>(new Set());

  const sheet = useConsumerSheetStore((state) => state.sheet);
  const openSheet = useConsumerSheetStore((state) => state.openSheet);
  const closeSheet = useConsumerSheetStore((state) => state.closeSheet);
  const detailMenuId = sheet?.type === 'menu-detail' ? sheet.menuId : '';
  const detailQuery = useConsumerMenuDetailQuery(sessionId, detailMenuId);

  const filteredItems = useMemo(() => {
    if (debouncedSearchQuery) return searchResult.data ?? [];
    return mainQuery.data?.menus ?? [];
  }, [debouncedSearchQuery, mainQuery.data?.menus, searchResult.data]);

  const categories = useMemo(
    () => ['전체', ...(mainQuery.data?.categories.map((category) => category.name) ?? [])],
    [mainQuery.data?.categories],
  );

  // 카테고리 탭은 목록을 필터링하지 않고 해당 섹션으로 스크롤만 이동시킨다 — 전체 목록은 항상 함께 보여준다.
  const groupedMenu = useMemo<OrderShellMenuGroup[]>(() => {
    return categories
      .slice(1)
      .map((category) => ({
        category,
        items: filteredItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredItems]);

  const totalCartQty = cart.reduce((sum, line) => sum + line.qty, 0);
  const totalCartPrice = cart.reduce((sum, line) => sum + calcCartLinePrice(line), 0);

  /**
   * 같은 메뉴라도 옵션 조합이 다르면 별도 줄로 담는다 — 병합 기준은 `menuId`가 아니라 `cartKey`다.
   */
  function addToCart(item: OrderShellMenuItem, qty = 1, options: OrderShellCartOption[] = []) {
    addCartItem(item, qty, options);
  }

  function findMenuItem(menuId: string) {
    if (detailQuery.data?.id === menuId) return detailQuery.data;
    return mainQuery.data?.menus.find((item) => item.id === menuId);
  }

  /** 수량이 0 이하가 되면 그 줄을 장바구니에서 없앤다. */
  function updateCartLineQty(cartKey: string, delta: number) {
    updateLineQuantity(cartKey, delta);
  }

  function removeCartLine(cartKey: string) {
    removeLine(cartKey);
    setSoldoutCartKeys((prev) => {
      if (!prev.has(cartKey)) return prev;
      const next = new Set(prev);
      next.delete(cartKey);
      return next;
    });
  }

  function startOrderProcessing() {
    if (cart.length === 0 || !session?.orderingAllowed || createOrder.isPending) return;

    setOrderPhase('processing');
    createOrder.mutate(
      { cart, clientRequestId: getOrCreateClientRequestId() },
      {
        onSuccess: () => {
          closeSheet();
          clearCart();
          setOrderPhase('complete');
          void queryClient.invalidateQueries({ queryKey: queryKeys.consumer.orders(sessionId) });
        },
        onError: (error) => {
          if (isTableInactiveError(error)) {
            queryClient.setQueryData<ConsumerSession>(queryKeys.consumer.session, (current) =>
              current
                ? {
                    ...current,
                    orderingAllowed: false,
                    orderingBlockedReason: 'TABLE_INACTIVE',
                  }
                : current,
            );
            void queryClient.invalidateQueries({ queryKey: queryKeys.consumer.session });
            setOrderPhase('idle');
            return;
          }

          if (error instanceof HttpError && error.status === 409) {
            setSoldoutModalItems(cart);
            setOrderPhase('idle');
            return;
          }

          if (error instanceof HttpError && error.status === 410) {
            clearCart();
            void queryClient.invalidateQueries({ queryKey: queryKeys.consumer.session });
            setOrderPhase('session-closed');
            return;
          }

          setOrderPhase('error-network');
        },
      },
    );
  }

  function placeOrder() {
    startOrderProcessing();
  }

  /**
   * 품절 확인 모달의 "확인" — 장바구니 줄들을 품절로 표기하고, 메뉴 목록·상세 시트에도 반영한다.
   * 옵션 없이 담은 줄은 메뉴 자체를 품절 처리하고, 옵션을 골라 담은 줄은 그 옵션만 품절 처리한다.
   */
  function confirmSoldoutModal() {
    if (!soldoutModalItems) return;

    setSoldoutCartKeys(new Set(soldoutModalItems.map((line) => line.cartKey)));

    const newlySoldoutMenuIds = soldoutModalItems
      .filter((line) => line.options.length === 0)
      .map((line) => line.menuId);
    if (newlySoldoutMenuIds.length > 0) {
      setSoldoutMenuIds((prev) => new Set([...prev, ...newlySoldoutMenuIds]));
    }

    const newlySoldoutOptionChoiceIds = soldoutModalItems.flatMap((line) =>
      line.options.map((option) => option.choiceId),
    );
    if (newlySoldoutOptionChoiceIds.length > 0) {
      setSoldoutOptionChoiceIds((prev) => new Set([...prev, ...newlySoldoutOptionChoiceIds]));
    }

    setSoldoutModalItems(null);
  }

  /** "주문 완료" 화면의 "메뉴로 돌아가기" — 메인 화면으로 되돌아간다. */
  function confirmOrderComplete() {
    setOrderPhase('idle');
  }

  /**
   * QA 전용 — 실패 판별 로직이 아직 없어 실제 흐름에서는 절대 도달하지 않는다.
   * 참고 저장소의 dev-nav 데모와 동일하게 화면 디자인만 강제로 띄워 확인한다.
   * 헤더(설정 버튼)에서 consumerOrderQaStore로 요청을 보내면 아래 effect가 소비한다.
   */
  const triggerOrderFailure = useCallback((type: 'network' | 'duplicate') => {
    if (type === 'duplicate') setDuplicateTime('10:52');
    setOrderPhase(type === 'network' ? 'error-network' : 'error-duplicate');
  }, []);

  /** QA 전용 — 시간초과 화면은 아직 실제 판별 로직이 없고, 마감 화면은 주문 API의 410으로도 진입한다. */
  const triggerSessionExpiry = useCallback((variant: 'timeout' | 'closed') => {
    setOrderPhase(variant === 'timeout' ? 'session-timeout' : 'session-closed');
  }, []);

  /**
   * QA 전용 — 참고 저장소는 navigator.onLine으로 실제 연결 끊김을 감지하지만,
   * 여기서는 아직 그 감지 로직을 붙이지 않아 QA 트리거로만 진입한다.
   */
  const triggerNetworkError = useCallback(() => {
    setOrderPhase('network-error');
  }, []);

  /**
   * QA 전용 — 품절 데모(qr-code-001)에서 한번 확인한 메뉴·옵션은 페이지를 새로고침하기 전까진
   * 세션 내내 풀리지 않는다. 참고 저장소의 "품절 초기화" dev-nav와 동일하게, 새로고침 없이도
   * 다시 처음부터 확인해볼 수 있도록 되돌리는 트리거.
   */
  const resetSoldoutDemo = useCallback(() => {
    setSoldoutMenuIds(new Set());
    setSoldoutOptionChoiceIds(new Set());
    setSoldoutCartKeys(new Set());
  }, []);

  // 헤더가 보낸 QA 요청을 구독한다 — 요청은 즉발성 이벤트라 렌더링 중 파생값으로 다룰 수 없어
  // effect 안에서 직접 setState하는 대신, 외부 스토어를 구독해 콜백에서만 반응한다.
  useEffect(() => {
    return useConsumerOrderQaStore.subscribe((state) => {
      if (state.pendingOrderFailure) {
        triggerOrderFailure(state.pendingOrderFailure);
        useConsumerOrderQaStore.getState().clearPendingOrderFailure();
      }
      if (state.pendingSessionExpiry) {
        triggerSessionExpiry(state.pendingSessionExpiry);
        useConsumerOrderQaStore.getState().clearPendingSessionExpiry();
      }
      if (state.pendingNetworkError) {
        triggerNetworkError();
        useConsumerOrderQaStore.getState().clearPendingNetworkError();
      }
      if (state.pendingSoldoutReset) {
        resetSoldoutDemo();
        useConsumerOrderQaStore.getState().clearPendingSoldoutReset();
      }
    });
  }, [triggerOrderFailure, triggerSessionExpiry, triggerNetworkError, resetSoldoutDemo]);

  /** 네트워크 실패 화면의 "다시 시도하기" — 처리중 화면부터 다시 시작한다. */
  function retryOrder() {
    startOrderProcessing();
  }

  /** 실패 화면의 "메인화면으로 이동" — idle로 되돌아간다. */
  function dismissOrderError() {
    setOrderPhase('idle');
  }

  /** 중복 주문 실패 화면의 "주문내역 확인하기" — idle로 되돌리고 주문내역 시트를 연다. */
  function viewOrderHistoryFromError() {
    setOrderPhase('idle');
    openSheet({ type: 'order-history' });
  }

  /**
   * 통신 오류 화면의 "다시 시도하기" — 참고 저장소는 navigator.onLine을 다시 확인해 온라인일
   * 때만 닫지만, 실제 감지가 붙기 전까지는 무조건 idle로 되돌린다.
   */
  function retryFromNetworkError() {
    setOrderPhase('idle');
  }

  const hasSoldoutInCart = cart.some((line) => soldoutCartKeys.has(line.cartKey));

  return {
    searchQuery,
    selectedCategory,
    categories,
    isLoading: mainQuery.isLoading,
    isError: mainQuery.isError,
    refetch: mainQuery.refetch,
    isSearchLoading: Boolean(
      isSearchDebouncing || (debouncedSearchQuery && searchResult.isFetching),
    ),
    isSearchError: Boolean(!isSearchDebouncing && debouncedSearchQuery && searchResult.isError),
    refetchSearch: searchResult.refetch,
    isDetailLoading: detailQuery.isLoading,
    isDetailError: detailQuery.isError,
    refetchDetail: detailQuery.refetch,
    groupedMenu,
    cart,
    totalCartQty,
    totalCartPrice,
    addToCart,
    updateCartLineQty,
    removeCartLine,
    findMenuItem,
    sheet,
    openMenuDetail: (menuId: string) => openSheet({ type: 'menu-detail', menuId }),
    openCart: () => openSheet({ type: 'cart' }),
    closeSheet,
    clearSearch: () => setSearchQuery(''),
    orderPhase,
    duplicateTime,
    placeOrder,
    confirmOrderComplete,
    retryOrder,
    dismissOrderError,
    viewOrderHistoryFromError,
    retryFromNetworkError,
    soldoutModalItems,
    confirmSoldoutModal,
    soldoutCartKeys,
    hasSoldoutInCart,
    orderingAllowed: session?.orderingAllowed ?? false,
    orderingBlockedReason: session?.orderingBlockedReason ?? null,
    isOrderPending: createOrder.isPending,
    soldoutMenuIds,
    soldoutOptionChoiceIds,
  };
}
