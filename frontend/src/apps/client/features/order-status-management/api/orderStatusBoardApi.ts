import { useQueryClient } from '@tanstack/react-query';
import type { CommonResponse } from '@/generated/types/commonResponse';
import type { StatusRequest } from '@/generated/types/statusRequest';
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

function toStatusRequest(
  row: OrderBoardRow,
  cancel?: { reason: string; description: string },
): StatusRequest {
  return {
    orderNum: Number(row.orderNo),
    header: {
      sysId: row.id,
      tableInfo: row.tableNum,
      orderDatetime: row.orderDatetime,
    },
    cancelReason: cancel?.reason,
    cancelDescription: cancel?.description,
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
  // TODO(order-status-contract): OpenAPI가 GET 중첩 객체를 `header.sysId`로 생성하면 이 호환 cast를 제거한다.
  const params = { 'header.sysId': orderId ?? '' } as unknown as GetStatusCancelResponsesParams;
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
