import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { createConsumerEventSource } from '../api/consumerEventSource';
import { useConsumerParticipantStore } from '@/apps/consumer/stores/consumerParticipantStore';

const DISCONNECTED_POLL_INTERVAL_MS = 5_000;
const SSE_RECONNECT_INTERVAL_MS = 3_000;

/**
 * SSE는 변경 신호만 받고, 실제 데이터는 기존 HTTP API로 다시 조회한다.
 * 연결이 끊긴 동안에는 5초 폴링으로 전환하고 EventSource 재연결 시 폴링을 멈춘다.
 */
export function useConsumerEvents(sessionId: string, active: boolean) {
  const queryClient = useQueryClient();
  const setParticipantCount = useConsumerParticipantStore((state) => state.setCount);
  const resetParticipantCount = useConsumerParticipantStore((state) => state.reset);

  useEffect(() => {
    if (!active || !sessionId) return undefined;

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
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

    const updateParticipantCount = (event: Event) => {
      if (!(event instanceof MessageEvent)) return;
      const count = Number(event.data);
      if (Number.isInteger(count) && count >= 1) setParticipantCount(count);
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

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, SSE_RECONNECT_INTERVAL_MS);
    };

    const connect = () => {
      if (disposed) return;

      try {
        const source = createConsumerEventSource();
        eventSource = source;
        source.addEventListener('ORDER_CREATED', invalidateOrders);
        source.addEventListener('STATUS_CHANGED', invalidateOrders);
        source.addEventListener('VISIT_CLOSED', invalidateSessionAndOrders);
        source.addEventListener('PARTICIPANTS_CHANGED', updateParticipantCount);
        source.onopen = () => {
          if (disposed || eventSource !== source) return;
          stopPolling();
        };
        source.onerror = () => {
          if (disposed || eventSource !== source) return;
          startPolling();
          source.close();
          eventSource = null;
          scheduleReconnect();
        };
      } catch {
        // EventSource를 만들 수 없는 동안에도 조회를 유지하고 명시적으로 재연결한다.
        startPolling();
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      disposed = true;
      stopPolling();
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      eventSource?.close();
      resetParticipantCount();
    };
  }, [active, queryClient, resetParticipantCount, sessionId, setParticipantCount]);
}
