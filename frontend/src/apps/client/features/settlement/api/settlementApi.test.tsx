import type { PropsWithChildren } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { useSettlementQuery } from './settlementApi';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('settlementApi', () => {
  it('조회 기간을 백엔드 ModelAttribute가 읽을 수 있는 평면 쿼리로 전송한다', async () => {
    let requestedUrl: URL | undefined;
    server.use(
      http.get('*/api/client/payment_manage/settlement/search', ({ request }) => {
        requestedUrl = new URL(request.url);
        return HttpResponse.json({ dailySales: [] });
      }),
    );

    const { result } = renderHook(
      () => useSettlementQuery({ startDate: '2026-11-01', endDate: '2026-11-05' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestedUrl?.searchParams.get('searchStartDate')).toBe('2026-11-01');
    expect(requestedUrl?.searchParams.get('searchEndDate')).toBe('2026-11-05');
    expect(requestedUrl?.searchParams.has('settlementRequest')).toBe(false);
  });
});
