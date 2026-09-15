import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrderShellMenuItem } from '@/apps/consumer/features/order-shell/types';
import { useConsumerCartStore } from './consumerCartStore';

const STORAGE_KEY = 'qr-order:consumer-cart';
const scope = {
  consumerSessionId: 'visit-1',
  sysPlantCd: 'STORE-1',
  tableSysId: 'table-1',
};

const menu: OrderShellMenuItem = {
  id: 'menu-1',
  name: '된장찌개',
  category: '메인',
  price: 8_000,
};

beforeEach(() => {
  useConsumerCartStore.setState({ cart: [], scope: null, clientRequestId: null });
  localStorage.clear();
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

  it('같은 방문 범위는 장바구니를 유지하고 다른 방문은 초기화한다', () => {
    const { bindScope, addItem } = useConsumerCartStore.getState();
    bindScope(scope);
    addItem(menu, 1, []);

    bindScope({ ...scope });
    expect(useConsumerCartStore.getState().cart).toHaveLength(1);

    bindScope({ ...scope, consumerSessionId: 'visit-2' });
    expect(useConsumerCartStore.getState().cart).toEqual([]);
  });

  it('새로고침 후에도 같은 방문의 장바구니를 복원한다', async () => {
    const { bindScope, addItem } = useConsumerCartStore.getState();
    bindScope(scope);
    addItem(menu, 2, []);
    const saved = localStorage.getItem(STORAGE_KEY);

    useConsumerCartStore.setState({ cart: [], scope: null, clientRequestId: null });
    localStorage.setItem(STORAGE_KEY, saved!);
    await useConsumerCartStore.persist.rehydrate();

    expect(useConsumerCartStore.getState()).toMatchObject({
      scope,
      clientRequestId: null,
      cart: [expect.objectContaining({ menuId: 'menu-1', qty: 2 })],
    });
  });

  it('손상된 저장 데이터는 복원하지 않는다', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { scope, cart: [{ menuId: 'menu-1', qty: 'invalid' }] },
        version: 1,
      }),
    );

    await useConsumerCartStore.persist.rehydrate();

    expect(useConsumerCartStore.getState()).toMatchObject({
      scope: null,
      cart: [],
      clientRequestId: null,
    });
  });

  it('이전 버전의 장바구니는 복원하지 않는다', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          scope,
          cart: [
            {
              cartKey: 'menu-1',
              menuId: 'menu-1',
              name: '된장찌개',
              price: 8_000,
              qty: 1,
              options: [],
            },
          ],
        },
        version: 0,
      }),
    );

    await useConsumerCartStore.persist.rehydrate();

    expect(useConsumerCartStore.getState()).toMatchObject({
      scope: null,
      cart: [],
      clientRequestId: null,
    });
  });

  it('브라우저 저장소가 실패해도 현재 탭의 장바구니는 동작한다', () => {
    useConsumerCartStore.getState().bindScope(scope);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('저장소 용량 초과', 'QuotaExceededError');
    });

    expect(() => useConsumerCartStore.getState().addItem(menu, 1, [])).not.toThrow();
    expect(useConsumerCartStore.getState().cart).toHaveLength(1);
  });

  it('같은 장바구니 재시도는 같은 요청 ID를 사용하고 수정 시 새 ID를 만든다', () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000001')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000002');
    const store = useConsumerCartStore.getState();
    store.bindScope(scope);
    store.addItem(menu, 1, []);

    expect(store.getOrCreateClientRequestId()).toBe('00000000-0000-4000-8000-000000000001');
    expect(store.getOrCreateClientRequestId()).toBe('00000000-0000-4000-8000-000000000001');

    store.updateLineQuantity('menu-1', 1);
    expect(store.getOrCreateClientRequestId()).toBe('00000000-0000-4000-8000-000000000002');
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
