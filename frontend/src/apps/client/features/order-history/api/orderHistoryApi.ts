/**
 * @fileoverview 주문 이력 조회 feature의 서버 연동 계층
 *
 * @description
 * Orval이 생성한 주문 이력 조회 훅을 사용하고, 백엔드 코드값을 화면 모델로 변환한다.
 */

import { useGetOrderHistory } from '@/generated/order-manage-controller/order-manage-controller';
import type { GetOrderHistoryParams } from '@/generated/types/getOrderHistoryParams';
import type { OrderHistoryResponse } from '@/generated/types/orderHistoryResponse';
import type { OrderMasterHistoryItem } from '@/generated/types/orderMasterHistoryItem';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type {
  OrderHistoryPaymentStatus,
  OrderHistoryRow,
  OrderHistorySearchParams,
  OrderHistoryStatus,
} from '../types';

const ORDER_STATUS_TO_API: Record<OrderHistoryStatus, string> = {
  RECEIVED: '01',
  COOKING: '02',
  SERVED: '03',
  CANCELLED: '99!',
};

const API_TO_ORDER_STATUS: Record<string, OrderHistoryStatus> = {
  '01': 'RECEIVED',
  '02': 'COOKING',
  '03': 'SERVED',
  '99!': 'CANCELLED',
};

function toApiOrderStatus(status: OrderHistorySearchParams['orderStatus']): string | undefined {
  return status ? ORDER_STATUS_TO_API[status] : undefined;
}

function toOrderStatus(status?: string): OrderHistoryStatus {
  return (status && API_TO_ORDER_STATUS[status]) || 'RECEIVED';
}

function toPaymentStatus(status?: string): OrderHistoryPaymentStatus {
  if (status === 'Y') return 'PAID';
  if (status === 'N') return 'UNPAID';
  return 'PENDING';
}

export function mapToOrderHistoryRow(item: OrderMasterHistoryItem): OrderHistoryRow {
  return {
    id: item.sysId ?? '',
    orderNo: item.orderNo ?? '',
    tableNum: item.tableNum ?? '',
    orderStatus: toOrderStatus(item.orderStatus),
    paymentStatus: toPaymentStatus(item.paymentStatus),
    orderDatetime: item.orderStartDatetime ?? '',
  };
}

export function mapToOrderHistoryRows(response: OrderHistoryResponse): OrderHistoryRow[] {
  return (response.orderMasterHistory ?? []).map(mapToOrderHistoryRow);
}

export function toOrderHistoryQueryParams(
  params: OrderHistorySearchParams,
): GetOrderHistoryParams {
  const queryParams: GetOrderHistoryParams = {
    startDate: params.startDate.slice(0, 10),
    endDate: params.endDate.slice(0, 10),
  };
  const searchKeyword = params.searchKeyword.trim();
  const orderStatus = toApiOrderStatus(params.orderStatus);

  if (searchKeyword) queryParams.searchKeyword = searchKeyword;
  if (orderStatus) queryParams.orderStatus = orderStatus;

  return queryParams;
}

export function useOrderHistoryQuery(params: OrderHistorySearchParams) {
  const queryParams = toOrderHistoryQueryParams(params);

  return useGetOrderHistory(queryParams, {
    query: {
      queryKey: queryKeys.orderHistory.list(params),
      select: mapToOrderHistoryRows,
      enabled: Boolean(params.startDate && params.endDate),
      ...queryPolicies.searchResult,
    },
  });
}

export function formatOrderHistoryDatetime(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}
