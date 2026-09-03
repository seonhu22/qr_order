import { create } from 'zustand';
import { buildCartKey } from '@/apps/consumer/features/order-shell/cartLine';
import type {
  OrderShellCartLine,
  OrderShellCartOption,
  OrderShellMenuItem,
} from '@/apps/consumer/features/order-shell/types';

type ConsumerCartStore = {
  cart: OrderShellCartLine[];
  addItem: (item: OrderShellMenuItem, qty: number, options: OrderShellCartOption[]) => void;
  updateLineQuantity: (cartKey: string, delta: number) => void;
  removeLine: (cartKey: string) => void;
  clearCart: () => void;
};

export const useConsumerCartStore = create<ConsumerCartStore>((set) => ({
  cart: [],
  addItem: (item, qty, options) =>
    set((state) => {
      const cartKey = buildCartKey(item.id, options);
      const existing = state.cart.find((line) => line.cartKey === cartKey);

      if (existing) {
        return {
          cart: state.cart.map((line) =>
            line.cartKey === cartKey ? { ...line, qty: line.qty + qty } : line,
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          { cartKey, menuId: item.id, name: item.name, price: item.price, qty, options },
        ],
      };
    }),
  updateLineQuantity: (cartKey, delta) =>
    set((state) => ({
      cart: state.cart.flatMap((line) => {
        if (line.cartKey !== cartKey) return [line];
        const nextQty = line.qty + delta;
        return nextQty <= 0 ? [] : [{ ...line, qty: nextQty }];
      }),
    })),
  removeLine: (cartKey) =>
    set((state) => ({ cart: state.cart.filter((line) => line.cartKey !== cartKey) })),
  clearCart: () => set({ cart: [] }),
}));
