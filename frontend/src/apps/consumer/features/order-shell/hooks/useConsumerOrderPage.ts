import { useMemo, useState } from 'react';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { ORDER_SHELL_CATEGORIES, ORDER_SHELL_MENU_ITEMS } from '../mock/orderShellMock';
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

  const sheet = useConsumerSheetStore((state) => state.sheet);
  const openSheet = useConsumerSheetStore((state) => state.openSheet);
  const closeSheet = useConsumerSheetStore((state) => state.closeSheet);

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
  };
}
