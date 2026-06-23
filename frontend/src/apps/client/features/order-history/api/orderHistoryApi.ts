/**
 * @fileoverview 주문 이력 조회 feature의 데이터 계층
 *
 * @description
 * 백엔드 `getOrderHistory`(`/api/client/order_manage/history/search`)는 `orderStatus`를
 * 필수 단일값으로 받고 응답에 주문번호/결제상태가 없어 이 화면과 맞지 않는다.
 * 그래서 실제 API 호출 없이 mock 데이터를 필터링하는 `queryFn`으로 임시 구현했다.
 * 백엔드 API가 확정되면 `filterOrderHistoryMock` 대신 실제 생성 훅의 `queryFn`으로 교체한다.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { ORDER_HISTORY_MOCK } from '../mock/orderHistoryMock';
import type { OrderHistoryRow, OrderHistorySearchParams } from '../types';

export function filterOrderHistoryMock(params: OrderHistorySearchParams): Promise<OrderHistoryRow[]> {
  const { startDate, endDate, searchKeyword, orderStatus } = params;
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const keyword = searchKeyword.trim();

  const rows = ORDER_HISTORY_MOCK.filter((row) => {
    const rowMs = new Date(row.orderDatetime).getTime();
    const inRange = rowMs >= startMs && rowMs <= endMs;
    const matchesKeyword =
      !keyword || row.orderNo.includes(keyword) || row.tableNum.includes(keyword);
    const matchesOrderStatus = !orderStatus || row.orderStatus === orderStatus;
    return inRange && matchesKeyword && matchesOrderStatus;
  });

  return Promise.resolve(rows);
}

export function useOrderHistoryQuery(params: OrderHistorySearchParams) {
  return useQuery({
    queryKey: queryKeys.orderHistory.list(params),
    queryFn: () => filterOrderHistoryMock(params),
    enabled: Boolean(params.startDate && params.endDate),
    ...queryPolicies.searchResult,
  });
}

export function formatOrderHistoryDatetime(value: string) {
  return value.replace('T', ' ').slice(0, 16);
}
