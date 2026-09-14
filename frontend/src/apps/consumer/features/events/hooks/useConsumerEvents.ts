import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { createConsumerEventSource } from '../api/consumerEventSource';

const DISCONNECTED_POLL_INTERVAL_MS = 5_000;

/**
 * SSE는 변경 신호만 받고, 실제 데이터는 기존 HTTP API로 다시 조회한다.
 * 연결이 끊긴 동안에는 5초 폴링으로 전환하고 EventSource 재연결 시 폴링을 멈춘다.
 */
export function useConsumerEvents(sessionId: string, active: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!active || !sessionId) return undefined;

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const invalidateOrders = () => {
      if (disposed) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.consumer.orders(sessionId) });
    };

    const invalidateSessionAndOrders = () => {
      if (disposed) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.consumer.session });
      invalidateOrders();
    };

    const stopPolling = () => {
      if (pollTimer === null) return;
      clearInterval(pollTimer);
      pollTimer = null;
    };

    const startPolling = () => {
      if (disposed || pollTimer !== null) return;
      pollTimer = setInterval(invalidateSessionAndOrders, DISCONNECTED_POLL_INTERVAL_MS);
    };

    try {
      eventSource = createConsumerEventSource();
      eventSource.addEventListener('ORDER_CREATED', invalidateOrders);
      eventSource.addEventListener('STATUS_CHANGED', invalidateOrders);
      eventSource.addEventListener('VISIT_CLOSED', invalidateSessionAndOrders);
      eventSource.onopen = stopPolling;
      eventSource.onerror = startPolling;
    } catch {
      // EventSource를 만들 수 없는 환경에서도 HTTP 폴링으로 조회 기능을 유지한다.
      startPolling();
    }

    return () => {
      disposed = true;
      stopPolling();
      eventSource?.close();
    };
  }, [active, queryClient, sessionId]);
}
