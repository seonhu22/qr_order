import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchManagerNotifications } from '../api/managerNotificationApi';
import { notificationReadId, notificationStorageKey, readNotificationIds, saveNotificationIds } from '../utils/notificationReadStorage';
import type { ClientNotificationItem } from '../types';

type Options = { enabled: boolean; userId: string; sysPlantCd: string };

export function useManagerNotificationCenter({ enabled, userId, sysPlantCd }: Options) {
  const active = enabled && Boolean(userId && sysPlantCd);
  const scope = JSON.stringify([userId, sysPlantCd]);
  const [readState, setReadState] = useState<{ scope: string; ids: string[] }>({ scope: '', ids: [] });
  const query = useQuery({
    queryKey: ['manager-notifications', userId, sysPlantCd],
    queryFn: ({ signal }) => fetchManagerNotifications(signal),
    enabled: active,
    retry: false,
    staleTime: 60_000,
    refetchInterval: active ? 60_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  });
  const readIds = readState.scope === scope ? readState.ids : readNotificationIds(userId, sysPlantCd);
  const items = active ? (query.data ?? []).map((item) => ({ ...item, seen: readIds.includes(notificationReadId(item)) })) : [];

  useEffect(() => {
    if (active && readState.scope === scope) saveNotificationIds(userId, sysPlantCd, readState.ids);
  }, [active, readState, scope, userId, sysPlantCd]);

  useEffect(() => {
    if (!active) return;
    const syncReadIds = (event: StorageEvent) => {
      if (event.key === null || event.key === notificationStorageKey(userId, sysPlantCd)) {
        setReadState({ scope, ids: readNotificationIds(userId, sysPlantCd) });
      }
    };
    window.addEventListener('storage', syncReadIds);
    return () => window.removeEventListener('storage', syncReadIds);
  }, [active, scope, userId, sysPlantCd]);

  const markRead = (ids: string[]) => {
    if (!active) return;
    setReadState((previous) => ({
      scope,
      ids: [...new Set([
        ...(previous.scope === scope ? previous.ids : readNotificationIds(userId, sysPlantCd)),
        ...ids,
      ])].slice(-1000),
    }));
  };

  return {
    items,
    unseenCount: items.filter((item) => !item.seen).length,
    markItemSeen: (item: ClientNotificationItem) => markRead([notificationReadId(item)]),
    markAllSeen: () => markRead(items.map(notificationReadId)),
    isError: active && query.isError,
  };
}
