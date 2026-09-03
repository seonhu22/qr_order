import { beforeEach, describe, expect, it } from 'vitest';
import type { OrderShellMenuItem } from '@/apps/consumer/features/order-shell/types';
import { useConsumerCartStore } from './consumerCartStore';

const menu: OrderShellMenuItem = {
  id: 'menu-1',
  name: '된장찌개',
  category: '메인',
  price: 8_000,
};

beforeEach(() => {
  useConsumerCartStore.setState({ cart: [] });
});

describe('consumerCartStore', () => {
  it('같은 메뉴와 옵션 조합은 하나의 줄로 합친다', () => {
    const { addItem } = useConsumerCartStore.getState();

    addItem(menu, 1, []);
    addItem(menu, 2, []);

    expect(useConsumerCartStore.getState().cart).toEqual([
      expect.objectContaining({ cartKey: 'menu-1', qty: 3 }),
    ]);
  });

  it('옵션 조합이 다르면 별도 줄로 담는다', () => {
    const { addItem } = useConsumerCartStore.getState();

    addItem(menu, 1, []);
    addItem(menu, 1, [
      { groupId: 'group-1', groupName: '밥', choiceId: 'rice', choiceName: '백미', price: 0 },
    ]);

    expect(useConsumerCartStore.getState().cart).toHaveLength(2);
  });

  it('수량이 0 이하가 되면 줄을 삭제한다', () => {
    const { addItem, updateLineQuantity } = useConsumerCartStore.getState();
    addItem(menu, 1, []);

    updateLineQuantity('menu-1', -1);

    expect(useConsumerCartStore.getState().cart).toEqual([]);
  });

  it('개별 삭제와 전체 초기화를 제공한다', () => {
    const { addItem, removeLine, clearCart } = useConsumerCartStore.getState();
    addItem(menu, 1, []);
    addItem({ ...menu, id: 'menu-2' }, 1, []);

    removeLine('menu-1');
    expect(useConsumerCartStore.getState().cart.map((line) => line.menuId)).toEqual(['menu-2']);

    clearCart();
    expect(useConsumerCartStore.getState().cart).toEqual([]);
  });
});
