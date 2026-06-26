/**
 * @fileoverview 주문 상태 보드 feature의 데이터 계층
 *
 * @description
 * 백엔드 주문 상태 보드 API가 아직 없어 mock 데이터를 그대로 반환하는 `queryFn`으로 임시 구현했다.
 * 백엔드 API가 확정되면 `fetchOrderStatusBoardMock` 대신 실제 생성 훅의 `queryFn`으로 교체한다.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { ORDER_STATUS_BOARD_MOCK } from '../mock/orderStatusBoardMock';
import type { OrderBoardRow } from '../types';

function fetchOrderStatusBoardMock(): Promise<OrderBoardRow[]> {
  return Promise.resolve(ORDER_STATUS_BOARD_MOCK);
}

export function useOrderStatusBoardQuery() {
  return useQuery({
    queryKey: queryKeys.orderStatusBoard.lists,
    queryFn: fetchOrderStatusBoardMock,
    ...queryPolicies.clientRealtimeStatus,
  });
}
