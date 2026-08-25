import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { useConsumerOrderQaStore } from '@/apps/consumer/stores/consumerOrderQaStore';
import { ORDER_SHELL_CATEGORIES, ORDER_SHELL_MENU_ITEMS } from '../mock/orderShellMock';
import { buildCartKey, calcCartLinePrice } from '../cartLine';
import type {
  OrderShellCartLine,
  OrderShellCartOption,
  OrderShellMenuGroup,
  OrderShellMenuItem,
} from '../types';

/** 참고 저장소의 `doOrder` 딜레이(1800ms)와 동일 — 실제 API 붙기 전까지 처리 중 화면을 보여주는 용도. */
const ORDER_PROCESSING_DELAY_MS = 1800;

/**
 * 주문 제출 진행 단계.
 * 실제 주문 파이프라인은 아직 항상 성공한다 — `error-network`/`error-duplicate`와
 * `session-timeout`/`session-closed`는 실제 판별 로직이 붙기 전까지 QA 전용 트리거로만 진입한다.
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
 * ConsumerOrderPage의 mock 장바구니를 소유한다(feature-local state).
 * 장바구니는 이번 PR엔 영속되지 않는 mock — 3단계에서 세션별 격리 store로 교체한다.
 * 검색어·선택 카테고리·시트 열림 상태는 ConsumerHeader와 공유해야 해서 zustand 스토어를 통해 읽는다.
 */
export function useConsumerOrderPage() {
  const searchQuery = useConsumerOrderFilterStore((state) => state.searchQuery);
  const setSearchQuery = useConsumerOrderFilterStore((state) => state.setSearchQuery);
  const selectedCategory = useConsumerOrderFilterStore((state) => state.selectedCategory);
  const [cart, setCart] = useState<OrderShellCartLine[]>([]);
  const [orderPhase, setOrderPhase] = useState<OrderPhase>('idle');
  const [duplicateTime, setDuplicateTime] = useState('');
  const orderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sheet = useConsumerSheetStore((state) => state.sheet);
  const openSheet = useConsumerSheetStore((state) => state.openSheet);
  const closeSheet = useConsumerSheetStore((state) => state.closeSheet);

  useEffect(() => () => {
    if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return ORDER_SHELL_MENU_ITEMS;
    return ORDER_SHELL_MENU_ITEMS.filter((item) => item.name.toLowerCase().includes(query));
  }, [searchQuery]);

  // 카테고리 탭은 목록을 필터링하지 않고 해당 섹션으로 스크롤만 이동시킨다 — 전체 목록은 항상 함께 보여준다.
  const groupedMenu = useMemo<OrderShellMenuGroup[]>(() => {
    return ORDER_SHELL_CATEGORIES.slice(1)
      .map((category) => ({
        category,
        items: filteredItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredItems]);

  const totalCartQty = cart.reduce((sum, line) => sum + line.qty, 0);
  const totalCartPrice = cart.reduce((sum, line) => sum + calcCartLinePrice(line), 0);

  /**
   * 같은 메뉴라도 옵션 조합이 다르면 별도 줄로 담는다 — 병합 기준은 `menuId`가 아니라 `cartKey`다.
   */
  function addToCart(item: OrderShellMenuItem, qty = 1, options: OrderShellCartOption[] = []) {
    const cartKey = buildCartKey(item.id, options);

    setCart((prev) => {
      const existing = prev.find((line) => line.cartKey === cartKey);
      if (existing) {
        return prev.map((line) =>
          line.cartKey === cartKey ? { ...line, qty: line.qty + qty } : line,
        );
      }
      return [
        ...prev,
        { cartKey, menuId: item.id, name: item.name, price: item.price, qty, options },
      ];
    });
  }

  function findMenuItem(menuId: string) {
    return ORDER_SHELL_MENU_ITEMS.find((item) => item.id === menuId);
  }

  /** 수량이 0 이하가 되면 그 줄을 장바구니에서 없앤다. */
  function updateCartLineQty(cartKey: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((line) => {
        if (line.cartKey !== cartKey) return [line];
        const nextQty = line.qty + delta;
        return nextQty <= 0 ? [] : [{ ...line, qty: nextQty }];
      }),
    );
  }

  function removeCartLine(cartKey: string) {
    setCart((prev) => prev.filter((line) => line.cartKey !== cartKey));
  }

  /**
   * "주문 처리중" 화면을 보여준 뒤, 실제 API가 붙기 전까지는 항상 성공으로 끝낸다 —
   * 참고 저장소의 doOrder/commitOrder와 동일한 흐름·딜레이.
   */
  function startOrderProcessing() {
    setOrderPhase('processing');
    orderTimerRef.current = setTimeout(() => {
      setCart([]);
      setOrderPhase('complete');
    }, ORDER_PROCESSING_DELAY_MS);
  }

  /** 장바구니 시트를 닫고 주문 처리를 시작한다. */
  function placeOrder() {
    closeSheet();
    startOrderProcessing();
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
    if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    if (type === 'duplicate') setDuplicateTime('10:52');
    setOrderPhase(type === 'network' ? 'error-network' : 'error-duplicate');
  }, []);

  /** QA 전용 — 세션 만료(시간초과·결제 완료로 인한 마감) 화면도 실제로는 아직 도달할 수 없다. */
  const triggerSessionExpiry = useCallback((variant: 'timeout' | 'closed') => {
    if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    setOrderPhase(variant === 'timeout' ? 'session-timeout' : 'session-closed');
  }, []);

  /**
   * QA 전용 — 참고 저장소는 navigator.onLine으로 실제 연결 끊김을 감지하지만,
   * 여기서는 아직 그 감지 로직을 붙이지 않아 QA 트리거로만 진입한다.
   */
  const triggerNetworkError = useCallback(() => {
    if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    setOrderPhase('network-error');
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
    });
  }, [triggerOrderFailure, triggerSessionExpiry, triggerNetworkError]);

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

  return {
    searchQuery,
    selectedCategory,
    categories: ORDER_SHELL_CATEGORIES,
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
  };
}
