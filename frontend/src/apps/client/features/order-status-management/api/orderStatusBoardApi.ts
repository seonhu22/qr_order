import { useQueryClient } from '@tanstack/react-query';
import type { CommonResponse } from '@/generated/types/commonResponse';
import type { StatusRequest } from '@/generated/types/statusRequest';
import type { LocalTime } from '@/generated/types/localTime';
import {
  useBackToCooking,
  useBackToReceiveOrder,
  useCancelOrder,
  useGetStatus,
  useGetStatusCancelResponses,
  useGoToCooking,
  useGoToServingComplete,
} from '@/generated/order-manage-controller/order-manage-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { OrderBoardRow } from '../types';
import type { GetStatusCancelResponsesParams } from '@/generated/types/getStatusCancelResponsesParams';
import { mapStatusResponsesToOrderBoardRows } from './orderStatusBoardMapper';

export type OrderStatusMutationAction =
  | 'START_COOKING'
  | 'SERVE'
  | 'BACK_TO_RECEIVED'
  | 'BACK_TO_COOKING'
  | 'CANCEL';

export class OrderStatusMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderStatusMutationError';
  }
}

function assertMutationSucceeded(response: CommonResponse): void {
  if (response.success !== true) {
    throw new OrderStatusMutationError(response.message || response.error || '주문 상태를 변경하지 못했습니다.');
  }
}

export function toStatusRequest(
  row: OrderBoardRow,
  cancel?: { reason: string; description: string },
): StatusRequest {
  return {
    orderNum: Number(row.orderNo),
    header: {
      sysId: row.id,
      tableNum: Number(row.tableNum),
      // OpenAPI는 LocalTime을 객체로 기술하지만 백엔드 @JsonFormat 계약은 HH:mm 문자열이다.
      orderDatetime: row.orderDatetime.slice(11, 16) as unknown as LocalTime,
    },
    cancelType: cancel?.reason,
    cancelReason: cancel ? (cancel.reason === 'OTHER' ? cancel.description : '') : undefined,
  };
}

export function useOrderStatusBoardQuery() {
  return useGetStatus({
    query: {
      queryKey: queryKeys.orderStatusBoard.lists,
      select: mapStatusResponsesToOrderBoardRows,
      ...queryPolicies.clientRealtimeStatus,
    },
  });
}

export function useOrderCancelReasonQuery(orderId?: string) {
  const params: GetStatusCancelResponsesParams = { sysId: orderId ?? '' };
  return useGetStatusCancelResponses(params, {
    query: {
      enabled: Boolean(orderId),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
    },
  });
}

export function useOrderStatusBoardMutations() {
  const queryClient = useQueryClient();
  const startCooking = useGoToCooking();
  const serve = useGoToServingComplete();
  const backToReceived = useBackToReceiveOrder();
  const backToCooking = useBackToCooking();
  const cancel = useCancelOrder();

  const mutate = async (
    action: OrderStatusMutationAction,
    row: OrderBoardRow,
    cancelInput?: { reason: string; description: string },
  ) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.orderStatusBoard.lists });
    const data = toStatusRequest(row, cancelInput);
    let response: CommonResponse;

    switch (action) {
      case 'START_COOKING':
        response = await startCooking.mutateAsync({ data });
        break;
      case 'SERVE':
        response = await serve.mutateAsync({ data });
        break;
      case 'BACK_TO_RECEIVED':
        response = await backToReceived.mutateAsync({ data });
        break;
      case 'BACK_TO_COOKING':
        response = await backToCooking.mutateAsync({ data });
        break;
      case 'CANCEL':
        response = await cancel.mutateAsync({ data });
        break;
    }

    assertMutationSucceeded(response);
    await queryClient.invalidateQueries({ queryKey: queryKeys.orderStatusBoard.lists });
  };

  return { mutate };
}
