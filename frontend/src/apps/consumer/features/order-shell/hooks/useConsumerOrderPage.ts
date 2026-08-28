import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { useConsumerOrderQaStore } from '@/apps/consumer/stores/consumerOrderQaStore';
import { useConsumerOrderHistoryStore } from '@/apps/consumer/stores/consumerOrderHistoryStore';
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
 * QR코드 qr-code-001(창가 1번 테이블, table-001)로 들어오면 장바구니 내용과 무관하게 항상
 * 품절 확인 모달이 뜨도록 하는 데모 트리거 — 참고 저장소의 한정수량 품절 시뮬레이션과 같은
 * 역할이지만, 실제 재고 판별 로직이 없어 QR코드로 진입 경로를 대신 표시했다.
 */
const SOLDOUT_DEMO_TABLE_SYS_ID = 'table-001';

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

  const { session } = useConsumerSession();
  const isSoldoutDemoTable = session?.tableSysId === SOLDOUT_DEMO_TABLE_SYS_ID;
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
  const addOrder = useConsumerOrderHistoryStore((state) => state.addOrder);

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
    setSoldoutCartKeys((prev) => {
      if (!prev.has(cartKey)) return prev;
      const next = new Set(prev);
      next.delete(cartKey);
      return next;
    });
  }

  /**
   * "주문 처리중" 화면을 보여준 뒤, 실제 API가 붙기 전까지는 항상 성공으로 끝낸다 —
   * 참고 저장소의 doOrder/commitOrder와 동일한 흐름·딜레이. 이 시점 장바구니를 그대로
   * 주문내역에 기록한다 — 결제 여부와 무관하게 "주문하기"가 성공하면 무조건 남는다.
   */
  function startOrderProcessing() {
    setOrderPhase('processing');
    orderTimerRef.current = setTimeout(() => {
      addOrder({
        orderId: `order-${Date.now()}`,
        orderedAt: new Date(),
        items: cart,
        total: totalCartPrice,
      });
      setCart([]);
      setOrderPhase('complete');
    }, ORDER_PROCESSING_DELAY_MS);
  }

  /**
   * 장바구니 시트를 닫고 주문 처리를 시작한다. 품절 데모 테이블(qr-code-001)이면 처리중 화면
   * 대신 품절 확인 모달을 먼저 띄우고, 시트는 닫지 않는다(참고 저장소의 initiateOrder와 동일).
   */
  function placeOrder() {
    if (isSoldoutDemoTable) {
      setSoldoutModalItems(cart);
      return;
    }
    closeSheet();
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
    soldoutModalItems,
    confirmSoldoutModal,
    soldoutCartKeys,
    hasSoldoutInCart,
    soldoutMenuIds,
    soldoutOptionChoiceIds,
  };
}
