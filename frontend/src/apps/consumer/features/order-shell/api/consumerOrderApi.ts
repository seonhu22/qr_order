import { useMutation, useQuery, useQueries } from '@tanstack/react-query';
import {
  createConsumerOrder,
  getConsumerOrder,
  getConsumerOrders,
} from '@/generated/consumer-order-controller/consumer-order-controller';
import type {
  ConsumerOrderCreateRequest,
  ConsumerOrderDetailResponse,
  ConsumerOrderSummary,
} from '@/generated/types';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { HttpError } from '@/shared/lib/httpClient';
import type { OrderShellCartLine, OrderShellOrderRecord } from '../types';

type ErrorPayload = { error?: unknown };

export function buildConsumerOrderRequest(cart: OrderShellCartLine[]): ConsumerOrderCreateRequest {
  return {
    clientRequestId: crypto.randomUUID(),
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

export function useConsumerOrderCreateMutation() {
  return useMutation({
    mutationFn: (cart: OrderShellCartLine[]) =>
      createConsumerOrder(buildConsumerOrderRequest(cart)),
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
