import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { buildCartKey } from '../cartLine';
import type { OrderShellCartLine, OrderShellCartOption, OrderShellMenuItem } from '../types';

export type ConsumerCartScope = {
  consumerSessionId: string;
  sysPlantCd: string;
  tableSysId: string;
};

type ConsumerCartStore = {
  cart: OrderShellCartLine[];
  scope: ConsumerCartScope | null;
  clientRequestId: string | null;
  bindScope: (scope: ConsumerCartScope) => void;
  getOrCreateClientRequestId: () => string;
  addItem: (item: OrderShellMenuItem, qty: number, options: OrderShellCartOption[]) => void;
  updateLineQuantity: (cartKey: string, delta: number) => void;
  removeLine: (cartKey: string) => void;
  clearCart: () => void;
};

type PersistedConsumerCart = Pick<ConsumerCartStore, 'cart' | 'scope' | 'clientRequestId'>;

const STORAGE_KEY = 'qr-order:consumer-cart';
const MAX_MENU_QUANTITY = 99;
const MAX_OPTIONS_PER_LINE = 100;

const failureTolerantStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // 저장소가 차단되거나 가득 찬 경우에도 현재 탭의 장바구니 동작은 유지한다.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // 저장소 접근 실패는 메모리 상태 초기화를 막지 않는다.
    }
  },
};

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
    Number.isSafeInteger(value.price) &&
    (value.qty === undefined ||
      (typeof value.qty === 'number' &&
        Number.isInteger(value.qty) &&
        value.qty > 0 &&
        value.qty <= MAX_MENU_QUANTITY))
  );
}

function isCartLine(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    isString(value.cartKey) &&
    isString(value.menuId) &&
    isString(value.name) &&
    typeof value.price === 'number' &&
    Number.isSafeInteger(value.price) &&
    value.price >= 0 &&
    typeof value.qty === 'number' &&
    Number.isInteger(value.qty) &&
    value.qty > 0 &&
    value.qty <= MAX_MENU_QUANTITY &&
    Array.isArray(value.options) &&
    value.options.length <= MAX_OPTIONS_PER_LINE &&
    value.options.every(isCartOption)
  );
}

function isPersistedCartState(value: unknown): value is PersistedConsumerCart {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<PersistedConsumerCart>;
  const scope = state.scope;

  if (
    state.clientRequestId !== null &&
    (!isString(state.clientRequestId) || state.clientRequestId.length > 36)
  ) {
    return false;
  }

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
    (set, get) => ({
      cart: [],
      scope: null,
      clientRequestId: null,
      bindScope: (scope) =>
        set((state) =>
          isSameConsumerCartScope(state.scope, scope)
            ? state
            : { scope, cart: [], clientRequestId: null },
        ),
      getOrCreateClientRequestId: () => {
        const existing = get().clientRequestId;
        if (existing) return existing;

        const clientRequestId = crypto.randomUUID();
        set({ clientRequestId });
        return clientRequestId;
      },
      addItem: (item, qty, options) =>
        set((state) => {
          const cartKey = buildCartKey(item.id, options);
          const existing = state.cart.find((line) => line.cartKey === cartKey);

          if (existing) {
            return {
              clientRequestId: null,
              cart: state.cart.map((line) =>
                line.cartKey === cartKey ? { ...line, qty: line.qty + qty } : line,
              ),
            };
          }

          return {
            clientRequestId: null,
            cart: [
              ...state.cart,
              { cartKey, menuId: item.id, name: item.name, price: item.price, qty, options },
            ],
          };
        }),
      updateLineQuantity: (cartKey, delta) =>
        set((state) => ({
          clientRequestId: null,
          cart: state.cart.flatMap((line) => {
            if (line.cartKey !== cartKey) return [line];
            const nextQty = line.qty + delta;
            return nextQty <= 0 ? [] : [{ ...line, qty: nextQty }];
          }),
        })),
      removeLine: (cartKey) =>
        set((state) => ({
          clientRequestId: null,
          cart: state.cart.filter((line) => line.cartKey !== cartKey),
        })),
      clearCart: () => set({ cart: [], clientRequestId: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => failureTolerantStorage),
      partialize: ({ cart, scope, clientRequestId }) => ({ cart, scope, clientRequestId }),
      migrate: () => ({ cart: [], scope: null, clientRequestId: null }),
      merge: (persistedState, currentState) =>
        isPersistedCartState(persistedState)
          ? { ...currentState, ...persistedState }
          : currentState,
    },
  ),
);
