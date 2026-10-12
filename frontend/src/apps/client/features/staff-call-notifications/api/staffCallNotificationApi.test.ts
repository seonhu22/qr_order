import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getUnreadStaffCallCount,
  useMarkStaffCallReadMutation,
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

  it('개별 완료 성공 시 대상 마스터만 미확인 캐시에서 제거한다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const notifications = [
      { masterSysId: 'MASTER-1', tableSysId: 'TABLE-1', tableNum: 1, insertDatetime: '2026-09-18T12:00:00', items: [] },
      { masterSysId: 'MASTER-2', tableSysId: 'TABLE-2', tableNum: 2, insertDatetime: '2026-09-18T12:01:00', items: [] },
    ] satisfies StaffCallNotification[];
    client.setQueryData(queryKeys.staffCallNotifications.unread, notifications);
    const fetchMock = (vi.spyOn(globalThis, 'fetch') as unknown as Mock).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const customWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useMarkStaffCallReadMutation(), { wrapper: customWrapper });

    await result.current.mutateAsync('MASTER-1');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/client/staff-call/notifications/MASTER-1/read',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(client.getQueryData(queryKeys.staffCallNotifications.unread)).toEqual([notifications[1]]);
  });

  it('개별 완료 실패 시 미확인 캐시를 유지한다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const notifications = [
      { masterSysId: 'MASTER-1', tableSysId: 'TABLE-1', tableNum: 1, insertDatetime: '2026-09-18T12:00:00', items: [] },
    ] satisfies StaffCallNotification[];
    client.setQueryData(queryKeys.staffCallNotifications.unread, notifications);
    (vi.spyOn(globalThis, 'fetch') as unknown as Mock).mockResolvedValue(
      new Response(JSON.stringify({ message: '처리 실패' }), { status: 500, headers: { 'Content-Type': 'application/json' } }),
    );
    const customWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useMarkStaffCallReadMutation(), { wrapper: customWrapper });

    await expect(result.current.mutateAsync('MASTER-1')).rejects.toThrow('처리 실패');
    expect(client.getQueryData(queryKeys.staffCallNotifications.unread)).toEqual(notifications);
  });
});
