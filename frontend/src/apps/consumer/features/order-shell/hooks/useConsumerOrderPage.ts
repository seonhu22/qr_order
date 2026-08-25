import { useMemo, useState } from 'react';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import {
  useConsumerMenuDetailQuery,
  useConsumerMenuMainQuery,
  useConsumerMenuSearchQuery,
} from '../api/consumerMenuApi';
import { buildCartKey, calcCartLinePrice } from '../cartLine';
import type {
  OrderShellCartLine,
  OrderShellCartOption,
  OrderShellMenuGroup,
  OrderShellMenuItem,
} from '../types';

/**
 * ConsumerOrderPage의 mock 장바구니를 소유한다(feature-local state).
 * 장바구니는 이번 PR엔 영속되지 않는 mock — 3단계에서 세션별 격리 store로 교체한다.
 * 검색어·선택 카테고리·시트 열림 상태는 ConsumerHeader와 공유해야 해서 zustand 스토어를 통해 읽는다.
 */
export function useConsumerOrderPage() {
  const searchQuery = useConsumerOrderFilterStore((state) => state.searchQuery);
  const selectedCategory = useConsumerOrderFilterStore((state) => state.selectedCategory);
  const [cart, setCart] = useState<OrderShellCartLine[]>([]);
  const { session } = useConsumerSession();
  const sessionId = session?.tableSysId ?? '';
  const mainQuery = useConsumerMenuMainQuery(sessionId);
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);
  const isSearchDebouncing = searchQuery.trim() !== debouncedSearchQuery;
  const searchResult = useConsumerMenuSearchQuery(sessionId, debouncedSearchQuery);

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
    return categories.slice(1)
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
    if (detailQuery.data?.id === menuId) return detailQuery.data;
    return mainQuery.data?.menus.find((item) => item.id === menuId);
  }

  return {
    searchQuery,
    selectedCategory,
    categories,
    isLoading: mainQuery.isLoading,
    isError: mainQuery.isError,
    refetch: mainQuery.refetch,
    isSearchLoading: Boolean(isSearchDebouncing || (debouncedSearchQuery && searchResult.isFetching)),
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
    findMenuItem,
    sheet,
    openMenuDetail: (menuId: string) => openSheet({ type: 'menu-detail', menuId }),
    openCart: () => openSheet({ type: 'cart' }),
    closeSheet,
  };
}
