import { useMutation, useQuery, useQueries } from '@tanstack/react-query';
import {
  createConsumerOrder,
  getConsumerOrder,
  getConsumerOrders,
} from '@/generated/consumer-order-controller/consumer-order-controller';
import type {
  ConsumerOrderCreateRequest,
  ConsumerOrderCreateResponse,
  ConsumerOrderDetailResponse,
  ConsumerOrderSummary,
} from '@/generated/types';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { HttpError } from '@/shared/lib/httpClient';
import type {
  OrderShellCartLine,
  OrderShellOrderCreated,
  OrderShellOrderRecord,
} from '../types';

type ErrorPayload = { error?: unknown };

export const CONSUMER_ORDER_REQUEST_TIMEOUT_MS = 15_000;

export function buildConsumerOrderRequest(
  cart: OrderShellCartLine[],
  clientRequestId: string = crypto.randomUUID(),
): ConsumerOrderCreateRequest {
  return {
    clientRequestId,
    items: cart.map((line) => ({
      menuSysId: line.menuId,
      quantity: line.qty,
      options: line.options.map((option) => ({
        optionSysId: option.choiceId,
        quantity: option.qty ?? 1,
      })),
    })),
  };
}

export function isTableInactiveError(error: unknown): boolean {
  if (!(error instanceof HttpError) || error.status !== 409) return false;
  const payload = error.payload as ErrorPayload | undefined;
  return payload?.error === 'TABLE_INACTIVE';
}

export function mapOrderCreated(response: ConsumerOrderCreateResponse): OrderShellOrderCreated {
  return {
    orderId: response.orderId,
    orderNo: response.orderNo,
    orderStatus: response.status,
    orderedAt: new Date(response.orderedAt.replace(' ', 'T')),
    total: response.totalAmount,
  };
}

/**
 * 15초 타임아웃으로 감싼 주문 생성 요청. 응답은 화면 모델(`OrderShellOrderCreated`)로
 * 변환해 반환한다 — 타임아웃/재시도 정책과 화면 모델 변환을 한 곳에서 다뤄, 호출부는
 * 어느 계층 관심사인지 신경 쓸 필요가 없다.
 */
export async function submitConsumerOrder(
  cart: OrderShellCartLine[],
  clientRequestId: string,
  timeoutMs: number = CONSUMER_ORDER_REQUEST_TIMEOUT_MS,
): Promise<OrderShellOrderCreated> {
  const abortController = new AbortController();
  const timeoutId = globalThis.setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const envelope = await createConsumerOrder(
      buildConsumerOrderRequest(cart, clientRequestId),
      undefined,
      abortController.signal,
    );
    return mapOrderCreated(envelope.data);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function useConsumerOrderCreateMutation() {
  return useMutation({
    mutationFn: ({
      cart,
      clientRequestId,
    }: {
      cart: OrderShellCartLine[];
      clientRequestId: string;
    }) => submitConsumerOrder(cart, clientRequestId),
  });
}

export function useConsumerOrdersQuery(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.consumer.orders(sessionId),
    queryFn: ({ signal }) =>
      getConsumerOrders(undefined, signal).then((response) => response.data.orders),
    enabled: Boolean(sessionId),
    ...queryPolicies.consumerOrder,
  });
}

function mapOrderDetail(detail: ConsumerOrderDetailResponse): OrderShellOrderRecord {
  return {
    orderId: detail.orderId,
    orderNo: detail.orderNo,
    orderStatus: detail.status,
    orderedAt: new Date(detail.orderedAt.replace(' ', 'T')),
    total: detail.totalAmount,
    items: detail.items.map((item) => ({
      cartKey: item.orderItemId,
      menuId: item.menuSysId,
      name: item.menuName,
      price: item.unitAmount,
      qty: item.quantity,
      options: item.options.map((option) => ({
        groupId: '',
        groupName: '',
        choiceId: option.optionSysId,
        choiceName: option.optionName,
        price: option.unitAmount,
        qty: option.quantity,
      })),
    })),
  };
}

export function useConsumerOrderDetailsQueries(sessionId: string, orders: ConsumerOrderSummary[]) {
  return useQueries({
    queries: orders.map((order) => ({
      queryKey: queryKeys.consumer.orderDetail(sessionId, order.orderId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getConsumerOrder(order.orderId, undefined, signal).then((response) =>
          mapOrderDetail(response.data),
        ),
      ...queryPolicies.consumerOrder,
    })),
  });
}
