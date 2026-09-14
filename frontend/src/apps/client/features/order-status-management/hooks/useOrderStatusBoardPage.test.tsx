import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { queryKeys } from '@/shared/api/queryKeys';
import type { OrderStatusCompatibleResponse } from '../api/orderStatusBoardMapper';
import {
  getOrderStatusMockStore,
  orderStatusHandlers,
  resetOrderStatusMockStore,
} from '../mock/orderStatusHandlers';
import { useOrderStatusBoardPage } from './useOrderStatusBoardPage';

function createWrapper(
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useOrderStatusBoardPage sync state', () => {
  beforeEach(() => {
    resetOrderStatusMockStore();
    server.use(...orderStatusHandlers);
  });

  it('최초 조회 실패는 데이터 없는 전체 오류 상태가 된다', async () => {
    server.use(
      http.get('*/api/client/order_manage/status/search', () =>
        HttpResponse.json({ message: '조회 실패' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.status.isInitialError).toBe(true));
    expect(result.current.data.columns.every((column) => column.rows.length === 0)).toBe(true);
  });

  it('후속 갱신 실패에는 기존 카드를 유지하고 다음 성공에서 복구한다', async () => {
    const { result } = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data.columns.some((column) => column.rows.length > 0)).toBe(true));
    const initialCount = result.current.data.columns.reduce((sum, column) => sum + column.rows.length, 0);

    server.use(
      http.get('*/api/client/order_manage/status/search', () =>
        HttpResponse.json({ message: '일시 실패' }, { status: 500 }),
      ),
    );
    await act(async () => {
      result.current.actions.handleRefresh();
    });
    await waitFor(() => expect(result.current.status.isSyncError).toBe(true));
    expect(result.current.data.columns.reduce((sum, column) => sum + column.rows.length, 0)).toBe(initialCount);

    server.use(...orderStatusHandlers);
    await act(async () => {
      result.current.actions.handleRefresh();
    });
    await waitFor(() => expect(result.current.status.isSyncError).toBe(false));
  });

  it('정상 조회 결과가 빈 배열이어도 후속 실패는 전체 최초 오류로 바꾸지 않는다', async () => {
    server.use(http.get('*/api/client/order_manage/status/search', () => HttpResponse.json([])));
    const { result } = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status.isLoading).toBe(false));

    server.use(
      http.get('*/api/client/order_manage/status/search', () =>
        HttpResponse.json({ message: '일시 실패' }, { status: 500 }),
      ),
    );
    act(() => result.current.actions.handleRefresh());

    await waitFor(() => expect(result.current.status.isSyncError).toBe(true));
    expect(result.current.status.isInitialError).toBe(false);
  });

  it('취소 사유 모달 진입 시 기존 GET API로 선택 주문의 사유를 조회한다', async () => {
    const { result } = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data.columns.some((column) => column.rows.length > 0)).toBe(true));
    const cancelled = result.current.data.columns
      .flatMap((column) => column.rows)
      .find((row) => row.id === 'order-002')!;

    act(() => result.current.actions.cardActions.onShowCancelReason(cancelled));

    await waitFor(() => expect(result.current.cancelReasonView.isLoading).toBe(false));
    expect(result.current.cancelReasonView.row).toMatchObject({
      id: 'order-002',
      cancelType: 'CUSTOMER_REQUEST',
    });
  });

  it('열린 취소 모달은 기존 스냅샷을 유지하고 닫았다 다시 열 때 최신 주문을 사용한다', async () => {
    const { result } = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data.columns.some((column) => column.rows.length > 0)).toBe(true));
    const received = result.current.data.columns
      .flatMap((column) => column.rows)
      .find((row) => row.id === 'order-010')!;

    act(() => result.current.actions.cardActions.onCancel(received));
    await act(async () => result.current.actions.cardActions.onStartCooking(received.id));
    await waitFor(() => {
      const latest = result.current.data.columns.flatMap((column) => column.rows).find((row) => row.id === received.id);
      expect(latest?.orderStatus).toBe('COOKING');
    });
    expect(result.current.cancelModal.targetRow?.orderStatus).toBe('RECEIVED');

    act(() => result.current.cancelModal.closeEditorModal());
    const latest = result.current.data.columns.flatMap((column) => column.rows).find((row) => row.id === received.id)!;
    act(() => result.current.actions.cardActions.onCancel(latest));
    expect(result.current.cancelModal.targetRow?.orderStatus).toBe('COOKING');
  });

  it('취소 카드 숨김은 새로고침 조회에도 유지되지만 페이지 재마운트에서 초기화된다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => {
      expect(first.result.current.data.columns.flatMap((column) => column.rows).some((row) => row.id === 'order-002')).toBe(true);
    });

    act(() => first.result.current.actions.cardActions.onDismiss('order-002'));
    act(() => first.result.current.dismissConfirm.confirm());
    expect(first.result.current.data.columns.flatMap((column) => column.rows).some((row) => row.id === 'order-002')).toBe(false);
    expect(getOrderStatusMockStore().some((row) => row.id === 'order-002')).toBe(true);
    const cached = queryClient.getQueryData<OrderStatusCompatibleResponse[]>(queryKeys.orderStatusBoard.lists);
    expect(cached?.some((group) => group.statusList?.some((item) => item.header?.sysId === 'order-002'))).toBe(true);

    act(() => first.result.current.actions.handleRefresh());
    await waitFor(() => expect(first.result.current.status.isRefreshing).toBe(false));
    expect(first.result.current.data.columns.flatMap((column) => column.rows).some((row) => row.id === 'order-002')).toBe(false);
    first.unmount();

    const second = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(second.result.current.data.columns.flatMap((column) => column.rows).some((row) => row.id === 'order-002')).toBe(true);
    });
  });

  it('다음 단계와 이전 단계로 이동한 카드를 대상 섹션 맨 아래에 배치한다', async () => {
    const { result } = renderHook(() => useOrderStatusBoardPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data.columns.some((column) => column.rows.length > 0)).toBe(true));

    await act(async () => result.current.actions.cardActions.onStartCooking('order-010'));
    await waitFor(() => {
      const cookingRows = result.current.data.columns.find((column) => column.status === 'COOKING')!.rows;
      expect(cookingRows.at(-1)?.id).toBe('order-010');
    });

    await act(async () => result.current.actions.cardActions.onMoveBack('order-010'));
    await waitFor(() => {
      const receivedRows = result.current.data.columns.find((column) => column.status === 'RECEIVED')!.rows;
      expect(receivedRows.at(-1)?.id).toBe('order-010');
    });
  });
});
