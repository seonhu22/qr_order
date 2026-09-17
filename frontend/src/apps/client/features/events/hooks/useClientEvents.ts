import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientStaffCallNotifyStore, type ClientStaffCallEvent } from '@/apps/client/stores/clientStaffCallNotifyStore';
import { queryKeys } from '@/shared/api/queryKeys';

const RECONNECT_MS = 3_000;

export function useClientEvents(active: boolean) {
  const receive = useClientStaffCallNotifyStore((state) => state.receive);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!active) return undefined;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      try {
        source = new EventSource('/api/sse/client/subscribe', { withCredentials: true });
      } catch {
        if (!disposed && reconnectTimer === null) {
          reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, RECONNECT_MS);
        }
        return;
      }
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
      source.onerror = () => {
        source?.close();
        source = null;
        if (!disposed && reconnectTimer === null) {
          reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, RECONNECT_MS);
        }
      };
    };
    connect();
    return () => {
      disposed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [active, receive, queryClient]);
}
