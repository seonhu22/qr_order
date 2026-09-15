import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClientStaffCallNotifyStore } from '@/apps/client/stores/clientStaffCallNotifyStore';
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
  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    useClientStaffCallNotifyStore.setState({ unreadCount: 0, latest: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('로그인 상태에서 credential을 포함한 Client 전용 채널을 구독한다', () => {
    const { unmount } = renderHook(() => useClientEvents(true));

    expect(MockEventSource.instances[0]).toMatchObject({
      url: '/api/sse/client/subscribe', withCredentials: true,
    });
    unmount();
    expect(MockEventSource.instances[0].close).toHaveBeenCalledOnce();
  });

  it('직원호출 이벤트를 파싱해 배지와 최근 알림에 반영한다', () => {
    renderHook(() => useClientEvents(true));
    const event = {
      tableSysId: 'TABLE-1', tableName: '3번', calledAt: '2026-09-15T18:00:00',
      items: [{ callCd: 'WATER', callName: '물', quantity: 2 }],
    };

    act(() => MockEventSource.instances[0].emit('STAFF_CALLED', JSON.stringify(event)));

    expect(useClientStaffCallNotifyStore.getState()).toMatchObject({ unreadCount: 1, latest: event });
  });

  it('오류 후 한 번만 재연결하고 unmount 시 타이머와 이전 stream을 정리한다', () => {
    const { unmount } = renderHook(() => useClientEvents(true));
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
    });
    expect(MockEventSource.instances).toHaveLength(0);

    rerender({ active: true });
    act(() => MockEventSource.instances[0].emit('STAFF_CALLED', '{invalid'));
    expect(useClientStaffCallNotifyStore.getState().unreadCount).toBe(0);
  });
});
