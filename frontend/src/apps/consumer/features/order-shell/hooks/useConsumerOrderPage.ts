import { useMemo, useState } from 'react';
import { useConsumerSheetStore } from '@/apps/consumer/stores/consumerSheetStore';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { ORDER_SHELL_CATEGORIES, ORDER_SHELL_MENU_ITEMS } from '../mock/orderShellMock';
import type { OrderShellCartLine, OrderShellMenuGroup, OrderShellMenuItem } from '../types';

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
  const totalCartPrice = cart.reduce((sum, line) => sum + line.price * line.qty, 0);

  function addToCart(item: OrderShellMenuItem) {
    setCart((prev) => {
      const existing = prev.find((line) => line.menuId === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuId === item.id ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [
        ...prev,
        { cartKey: item.id, menuId: item.id, name: item.name, price: item.price, qty: 1 },
      ];
    });
  }

  function findMenuItem(menuId: string) {
    return ORDER_SHELL_MENU_ITEMS.find((item) => item.id === menuId);
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
    findMenuItem,
    sheet,
    openMenuDetail: (menuId: string) => openSheet({ type: 'menu-detail', menuId }),
    openCart: () => openSheet({ type: 'cart' }),
    closeSheet,
  };
}
