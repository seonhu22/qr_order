import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/shared/api/queryKeys';
import { useConsumerEvents } from './useConsumerEvents';
import { useConsumerParticipantStore } from '@/apps/consumer/stores/consumerParticipantStore';

class MockEventSource {
  static instances: MockEventSource[] = [];

  readonly listeners = new Map<string, Set<EventListener>>();
  readonly url: string;
  readonly withCredentials: boolean;
  onopen: ((event: Event) => void) | null = null;
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

  emit(type: string, data?: string) {
    const event = data === undefined ? new Event(type) : new MessageEvent(type, { data });
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }
}

describe('useConsumerEvents', () => {
  let queryClient: QueryClient;
  let invalidate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    useConsumerParticipantStore.setState({ count: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    queryClient.clear();
  });

  function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it('opens one credentialed stream only for an active visit', () => {
    const { unmount } = renderHook(() => useConsumerEvents('VISIT-1', true), { wrapper });

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0]).toMatchObject({
      url: '/api/client/consumer/events',
      withCredentials: true,
    });
    unmount();
    expect(MockEventSource.instances[0].close).toHaveBeenCalledOnce();
  });

  it('invalidates current visit orders for order and status signals', () => {
    renderHook(() => useConsumerEvents('VISIT-1', true), { wrapper });
    const source = MockEventSource.instances[0];

    act(() => source.emit('ORDER_CREATED'));
    act(() => source.emit('STATUS_CHANGED'));

    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(invalidate).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.consumer.orders('VISIT-1'),
    });
  });

  it('refreshes session and orders when the visit closes', () => {
    renderHook(() => useConsumerEvents('VISIT-1', true), { wrapper });

    act(() => MockEventSource.instances[0].emit('VISIT_CLOSED'));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.consumer.session });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.consumer.orders('VISIT-1'),
    });
  });

  it('updates the unique QR participant count from SSE', () => {
    renderHook(() => useConsumerEvents('VISIT-1', true), { wrapper });

    act(() => MockEventSource.instances[0].emit('PARTICIPANTS_CHANGED', '2'));

    expect(useConsumerParticipantStore.getState().count).toBe(2);
  });

  it('polls while disconnected, creates a new stream, and stops after reconnect', () => {
    const { unmount } = renderHook(() => useConsumerEvents('VISIT-1', true), { wrapper });
    const source = MockEventSource.instances[0];

    act(() => source.onerror?.(new Event('error')));
    act(() => vi.advanceTimersByTime(5_000));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.consumer.session });
    expect(source.close).toHaveBeenCalledOnce();
    expect(MockEventSource.instances).toHaveLength(2);
    invalidate.mockClear();

    act(() => MockEventSource.instances[1].onopen?.(new Event('open')));
    act(() => vi.advanceTimersByTime(10_000));
    expect(invalidate).not.toHaveBeenCalled();

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not subscribe for an inactive visit', () => {
    renderHook(() => useConsumerEvents('VISIT-1', false), { wrapper });

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('ignores events from a stream disposed by a visit change', () => {
    const { rerender } = renderHook(
      ({ sessionId }) => useConsumerEvents(sessionId, true),
      { wrapper, initialProps: { sessionId: 'VISIT-1' } },
    );
    const previousVisitSource = MockEventSource.instances[0];

    rerender({ sessionId: 'VISIT-2' });
    invalidate.mockClear();
    act(() => previousVisitSource.emit('STATUS_CHANGED'));

    expect(previousVisitSource.close).toHaveBeenCalledOnce();
    expect(invalidate).not.toHaveBeenCalled();
    expect(MockEventSource.instances).toHaveLength(2);
  });
});
