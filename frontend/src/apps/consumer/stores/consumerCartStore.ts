import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildCartKey } from '@/apps/consumer/features/order-shell/cartLine';
import type {
  OrderShellCartLine,
  OrderShellCartOption,
  OrderShellMenuItem,
} from '@/apps/consumer/features/order-shell/types';

export type ConsumerCartScope = {
  consumerSessionId: string;
  sysPlantCd: string;
  tableSysId: string;
};

type ConsumerCartStore = {
  cart: OrderShellCartLine[];
  scope: ConsumerCartScope | null;
  bindScope: (scope: ConsumerCartScope) => void;
  addItem: (item: OrderShellMenuItem, qty: number, options: OrderShellCartOption[]) => void;
  updateLineQuantity: (cartKey: string, delta: number) => void;
  removeLine: (cartKey: string) => void;
  clearCart: () => void;
};

type PersistedConsumerCart = Pick<ConsumerCartStore, 'cart' | 'scope'>;

const STORAGE_KEY = 'qr-order:consumer-cart';

export function isSameConsumerCartScope(
  current: ConsumerCartScope | null,
  next: ConsumerCartScope,
) {
  return (
    current?.consumerSessionId === next.consumerSessionId &&
    current.sysPlantCd === next.sysPlantCd &&
    current.tableSysId === next.tableSysId
  );
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isCartOption(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isString(value.groupId) &&
    isString(value.groupName) &&
    isString(value.choiceId) &&
    isString(value.choiceName) &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    (value.qty === undefined ||
      (typeof value.qty === 'number' && Number.isInteger(value.qty) && value.qty > 0))
  );
}

function isCartLine(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isString(value.cartKey) &&
    isString(value.menuId) &&
    isString(value.name) &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    typeof value.qty === 'number' &&
    Number.isInteger(value.qty) &&
    value.qty > 0 &&
    Array.isArray(value.options) &&
    value.options.every(isCartOption)
  );
}

function isPersistedCartState(value: unknown): value is PersistedConsumerCart {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<PersistedConsumerCart>;
  const scope = state.scope;

  if (
    scope !== null &&
    (!scope ||
      !isString(scope.consumerSessionId) ||
      !isString(scope.sysPlantCd) ||
      !isString(scope.tableSysId))
  ) {
    return false;
  }

  return (
    Array.isArray(state.cart) &&
    state.cart.every(isCartLine)
  );
}

export const useConsumerCartStore = create<ConsumerCartStore>()(
  persist(
    (set) => ({
      cart: [],
      scope: null,
      bindScope: (scope) =>
        set((state) =>
          isSameConsumerCartScope(state.scope, scope) ? state : { scope, cart: [] },
        ),
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
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ cart, scope }) => ({ cart, scope }),
      merge: (persistedState, currentState) =>
        isPersistedCartState(persistedState)
          ? { ...currentState, ...persistedState }
          : currentState,
    },
  ),
);
