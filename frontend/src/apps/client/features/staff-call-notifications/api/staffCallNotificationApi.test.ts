import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createElement, type ReactNode } from 'react';
import {
  getUnreadStaffCallCount,
  useUnreadStaffCallsQuery,
  type StaffCallNotification,
} from './staffCallNotificationApi';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe('staffCallNotificationApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('한 번의 호출에 여러 항목이 있어도 마스터 한 건으로 반환한다', async () => {
    const payload: StaffCallNotification[] = [
      {
        masterSysId: 'MASTER-1',
        tableSysId: 'TABLE-1',
        tableNum: 3,
        insertDatetime: '2026-09-18T12:00:00',
        items: [
          {
            sysId: 'ITEM-1',
            callCd: 'WATER',
            callNm: '물',
            description: null,
            quantity: 2,
          },
          {
            sysId: 'ITEM-2',
            callCd: 'NAPKIN',
            callNm: '냅킨',
            description: null,
            quantity: 1,
          },
        ],
      },
    ];
    (vi.spyOn(globalThis, 'fetch') as unknown as Mock).mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    const { result } = renderHook(() => useUnreadStaffCallsQuery(true), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payload);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.masterSysId).toBe('MASTER-1');
    expect(result.current.data?.[0]?.tableNum).toBe(3);
    expect(result.current.data?.[0]?.items).toHaveLength(2);
    expect(result.current.data?.[0]?.items[0]?.quantity).toBe(2);
    expect(getUnreadStaffCallCount(result.current.data ?? [])).toBe(1);
  });
});
