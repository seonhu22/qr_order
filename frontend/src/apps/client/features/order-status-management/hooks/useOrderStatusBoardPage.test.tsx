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
});
