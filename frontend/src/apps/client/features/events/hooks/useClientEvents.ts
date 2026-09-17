import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientStaffCallNotifyStore, type ClientStaffCallEvent } from '@/apps/client/stores/clientStaffCallNotifyStore';
import { queryKeys } from '@/shared/api/queryKeys';
import { notifyUnauthorized } from '@/shared/auth/authRedirect';
import { useClientSseConnectionStore } from '@/apps/client/stores/clientSseConnectionStore';

const RECONNECT_DELAYS = [3_000, 6_000, 12_000, 30_000, 60_000] as const;
const DEGRADED_AFTER_FAILURES = 5;

export function useClientEvents(active: boolean) {
  const receive = useClientStaffCallNotifyStore((state) => state.receive);
  const queryClient = useQueryClient();
  const setDegraded = useClientSseConnectionStore((state) => state.setDegraded);

  useEffect(() => {
    if (!active) return undefined;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let failureCount = 0;

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null || !navigator.onLine) return;
      const delayIndex = Math.max(0, failureCount - 1);
      const baseDelay = RECONNECT_DELAYS[Math.min(delayIndex, RECONNECT_DELAYS.length - 1)];
      const delay = baseDelay + Math.floor(Math.random() * 2_000);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const canReconnect = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.status === 401) {
          notifyUnauthorized({ message: '로그인이 만료되었습니다.' });
          return false;
        }
        return response.status !== 403;
      } catch {
        return true;
      }
    };

    function connect() {
      if (disposed) return;
      try {
        source = new EventSource('/api/sse/client/subscribe', { withCredentials: true });
      } catch {
        failureCount += 1;
        setDegraded(failureCount >= DEGRADED_AFTER_FAILURES);
        scheduleReconnect();
        return;
      }
      source.onopen = () => {
        failureCount = 0;
        setDegraded(false);
      };
      source.addEventListener('STAFF_CALLED', (event) => {
        if (disposed) return;
        try {
          receive(JSON.parse((event as MessageEvent<string>).data) as ClientStaffCallEvent);
          void queryClient.invalidateQueries({ queryKey: queryKeys.staffCallNotifications.unread });
        }
        catch { /* 잘못된 이벤트 하나는 다음 이벤트 수신을 막지 않는다. */ }
      });
      source.addEventListener('ORDER_STATUS_CHANGED', () => {
        if (disposed) return;
        try { queryClient.invalidateQueries({ queryKey: queryKeys.orderStatusBoard.lists }); }
        catch { /* 쿼리 무효화 실패는 다음 이벤트 처리를 막지 않는다. */ }
      });
      source.onerror = async () => {
        source?.close();
        source = null;
        failureCount += 1;
        setDegraded(failureCount >= DEGRADED_AFTER_FAILURES);
        if (await canReconnect()) scheduleReconnect();
      };
    }
    const handleOnline = () => {
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      connect();
    };
    window.addEventListener('online', handleOnline);
    connect();
    return () => {
      disposed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      source?.close();
      window.removeEventListener('online', handleOnline);
      setDegraded(false);
    };
  }, [active, receive, queryClient, setDegraded]);
}
