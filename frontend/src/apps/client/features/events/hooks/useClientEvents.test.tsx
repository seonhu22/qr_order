import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useClientStaffCallNotifyStore } from '@/apps/client/stores/clientStaffCallNotifyStore';
import { queryKeys } from '@/shared/api/queryKeys';
import { useClientEvents } from './useClientEvents';

class MockEventSource {
  static instances: MockEventSource[] = [];
  readonly listeners = new Map<string, Set<EventListener>>();
  readonly url: string;
  readonly withCredentials: boolean;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();

  constructor(url: string | URL, init?: EventSourceInit) {
    this.url = url.toString();
    this.withCredentials = init?.withCredentials ?? false;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  emit(type: string, data: string) {
    const event = new MessageEvent(type, { data });
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

describe('useClientEvents', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    useClientStaffCallNotifyStore.setState({ unreadCount: 0, latest: null });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    queryClient.clear();
  });

  it('로그인 상태에서 credential을 포함한 Client 전용 채널을 구독한다', () => {
    const { unmount } = renderHook(() => useClientEvents(true), { wrapper });

    expect(MockEventSource.instances[0]).toMatchObject({
      url: '/api/sse/client/subscribe', withCredentials: true,
    });
    unmount();
    expect(MockEventSource.instances[0].close).toHaveBeenCalledOnce();
  });

  it('직원호출 이벤트를 파싱해 배지와 최근 알림에 반영한다', () => {
    renderHook(() => useClientEvents(true), { wrapper });
    const event = {
      tableSysId: 'TABLE-1', tableName: '3번', calledAt: '2026-09-15T18:00:00',
      items: [{ callCd: 'WATER', callName: '물', quantity: 2 }],
    };

    act(() => MockEventSource.instances[0].emit('STAFF_CALLED', JSON.stringify(event)));

    expect(useClientStaffCallNotifyStore.getState()).toMatchObject({ unreadCount: 1, latest: event });
  });

  it('오류 후 한 번만 재연결하고 unmount 시 타이머와 이전 stream을 정리한다', () => {
    const { unmount } = renderHook(() => useClientEvents(true), { wrapper });
    const first = MockEventSource.instances[0];

    act(() => first.onerror?.(new Event('error')));
    expect(first.close).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(3_000));
    expect(MockEventSource.instances).toHaveLength(2);

    unmount();
    expect(MockEventSource.instances[1].close).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    act(() => first.emit('STAFF_CALLED', '{}'));
    expect(useClientStaffCallNotifyStore.getState().unreadCount).toBe(0);
  });

  it('로그아웃 상태에서는 구독하지 않고 잘못된 JSON 이벤트를 무시한다', () => {
    const { rerender } = renderHook(({ active }) => useClientEvents(active), {
      initialProps: { active: false },
      wrapper,
    });
    expect(MockEventSource.instances).toHaveLength(0);

    rerender({ active: true });
    act(() => MockEventSource.instances[0].emit('STAFF_CALLED', '{invalid'));
    expect(useClientStaffCallNotifyStore.getState().unreadCount).toBe(0);
  });

  it('ORDER_STATUS_CHANGED 수신 시 orderStatusBoard 쿼리를 무효화한다', async () => {
    queryClient.setQueryData(queryKeys.orderStatusBoard.lists, []);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useClientEvents(true), { wrapper });

    await act(async () => {
      MockEventSource.instances[0].emit('ORDER_STATUS_CHANGED', '');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.orderStatusBoard.lists });
  });

  it('ORDER_STATUS_CHANGED 핸들러 내 예외가 발생해도 이후 STAFF_CALLED 이벤트를 처리한다', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValueOnce(new Error('무효화 실패'));

    renderHook(() => useClientEvents(true), { wrapper });
    const source = MockEventSource.instances[0];

    await act(async () => {
      source.emit('ORDER_STATUS_CHANGED', '');
    });

    const event = {
      tableSysId: 'TABLE-2', tableName: '5번', calledAt: '2026-09-16T10:00:00',
      items: [{ callCd: 'CALL', callName: '직원호출', quantity: 1 }],
    };
    act(() => source.emit('STAFF_CALLED', JSON.stringify(event)));

    expect(useClientStaffCallNotifyStore.getState()).toMatchObject({ unreadCount: 1, latest: event });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenLastCalledWith({
      queryKey: queryKeys.staffCallNotifications.unread,
    });
  });
});
