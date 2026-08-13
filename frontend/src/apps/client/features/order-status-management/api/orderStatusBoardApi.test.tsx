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
      totalPrice: 42700,
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

  it('기타 취소는 선택 코드를 cancelType, 직접 입력을 cancelReason으로 전송한다', async () => {
    let requestBody: unknown;
    server.use(
      http.post('*/api/client/order_manage/status/cancel_order', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    const { wrapper } = createHarness();
    const { result } = renderHook(() => ({
      query: useOrderStatusBoardQuery(),
      mutations: useOrderStatusBoardMutations(),
    }), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const row = result.current.query.data!.find((item) => item.id === 'order-010')!;
    await act(async () => {
      await result.current.mutations.mutate('CANCEL', row, {
        reason: 'OTHER',
        description: '고객 변심',
      });
    });

    expect(requestBody).toMatchObject({
      header: { sysId: 'order-010' },
      cancelType: 'OTHER',
      cancelReason: '고객 변심',
    });
  });

  it('일반 취소는 cancelReason을 빈 문자열로 전송한다', async () => {
    let requestBody: unknown;
    server.use(
      http.post('*/api/client/order_manage/status/cancel_order', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    const { wrapper } = createHarness();
    const { result } = renderHook(() => ({
      query: useOrderStatusBoardQuery(),
      mutations: useOrderStatusBoardMutations(),
    }), { wrapper });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const row = result.current.query.data!.find((item) => item.id === 'order-010')!;
    await act(async () => {
      await result.current.mutations.mutate('CANCEL', row, {
        reason: 'CUSTOMER_REQUEST',
        description: '',
      });
    });

    expect(requestBody).toMatchObject({
      cancelType: 'CUSTOMER_REQUEST',
      cancelReason: '',
    });
  });
});
