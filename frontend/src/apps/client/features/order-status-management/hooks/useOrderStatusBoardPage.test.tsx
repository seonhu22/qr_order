import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { orderStatusHandlers, resetOrderStatusMockStore } from '../mock/orderStatusHandlers';
import { useOrderStatusBoardPage } from './useOrderStatusBoardPage';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
      cancelReason: 'CUSTOMER_REQUEST',
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
});
