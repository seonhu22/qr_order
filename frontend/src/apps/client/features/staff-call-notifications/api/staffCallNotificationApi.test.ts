import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { useUnreadStaffCallsQuery, type StaffCallNotification } from './staffCallNotificationApi';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe('staffCallNotificationApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('미확인 알림 응답을 masterSysId 와 quantity 를 포함한 형태로 반환한다', async () => {
    const payload: StaffCallNotification[] = [
      {
        masterSysId: 'MASTER-1',
        sysId: 'ITEM-1',
        callCd: 'WATER',
        callNm: '물',
        description: null,
        quantity: 2,
        insertDatetime: '2026-09-18T12:00:00',
      },
    ];
    (vi.spyOn(globalThis, 'fetch') as unknown as Mock).mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    const { result } = renderHook(() => useUnreadStaffCallsQuery(true), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payload);
    expect(result.current.data?.[0]?.masterSysId).toBe('MASTER-1');
    expect(result.current.data?.[0]?.quantity).toBe(2);
  });
});
