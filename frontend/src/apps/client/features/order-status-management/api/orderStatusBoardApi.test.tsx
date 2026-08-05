import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { orderStatusHandlers, resetOrderStatusMockStore } from '../mock/orderStatusHandlers';
import { useOrderStatusBoardMutations, useOrderStatusBoardQuery } from './orderStatusBoardApi';

function createHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('orderStatusBoardApi', () => {
  beforeEach(() => {
    resetOrderStatusMockStore();
    server.use(...orderStatusHandlers);
  });

  it('Orval 조회를 화면 주문 모델로 변환한다', async () => {
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useOrderStatusBoardQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const row = result.current.data?.find((item) => item.id === 'order-010');
    expect(row).toMatchObject({
      orderStatus: 'RECEIVED',
      tableNum: '5',
    });
    expect(row?.menuItems[0]).toMatchObject({ name: '쌀국수', unitPrice: 11900 });
  });

  it('mutation 성공 후 같은 query를 재조회해 서버 상태를 반영한다', async () => {
    const { wrapper } = createHarness();
    const { result } = renderHook(() => ({
      query: useOrderStatusBoardQuery(),
      mutations: useOrderStatusBoardMutations(),
    }), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const row = result.current.query.data?.find((item) => item.id === 'order-010');
    expect(row).toBeDefined();

    await act(async () => {
      await result.current.mutations.mutate('START_COOKING', row!);
    });

    await waitFor(() => {
      expect(result.current.query.data?.find((item) => item.id === 'order-010')?.orderStatus).toBe('COOKING');
    });
  });

  it('HTTP 200이어도 success false이면 성공 처리하지 않는다', async () => {
    server.use(
      http.post('*/api/client/order_manage/status/go_to_cooking', () =>
        HttpResponse.json({ success: false, message: '상태 변경 거부' }),
      ),
    );
    const { wrapper } = createHarness();
    const { result } = renderHook(() => ({
      query: useOrderStatusBoardQuery(),
      mutations: useOrderStatusBoardMutations(),
    }), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const row = result.current.query.data!.find((item) => item.id === 'order-010')!;

    await expect(result.current.mutations.mutate('START_COOKING', row)).rejects.toThrow('상태 변경 거부');
    expect(result.current.query.data?.find((item) => item.id === 'order-010')?.orderStatus).toBe('RECEIVED');
  });
});
