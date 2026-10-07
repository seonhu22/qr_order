import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { httpClient } from '@/shared/lib/httpClient';

export type StaffCallNotification = {
  masterSysId: string;
  tableSysId: string;
  tableNum: number;
  insertDatetime: string;
  items: StaffCallNotificationItem[];
};

export type StaffCallNotificationItem = {
  sysId: string;
  callCd: string;
  callNm: string;
  description?: string | null;
  quantity: number;
};

export function getUnreadStaffCallCount(notifications: StaffCallNotification[]) {
  return notifications.length;
}

function getUnreadStaffCalls() {
  return httpClient<StaffCallNotification[]>({
    url: '/api/client/staff-call/notifications/unread',
    method: 'GET',
  });
}

function markAllStaffCallsRead() {
  return httpClient({
    url: '/api/client/staff-call/notifications/read-all',
    method: 'POST',
  });
}

function markStaffCallRead(masterSysId: string) {
  return httpClient({
    url: `/api/client/staff-call/notifications/${encodeURIComponent(masterSysId)}/read`,
    method: 'POST',
  });
}

export function useUnreadStaffCallsQuery(active: boolean) {
  return useQuery({
    queryKey: queryKeys.staffCallNotifications.unread,
    queryFn: getUnreadStaffCalls,
    enabled: active,
    ...queryPolicies.clientRealtimeStatus,
  });
}

export function useMarkAllStaffCallsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllStaffCallsRead,
    onSuccess: () => queryClient.setQueryData(queryKeys.staffCallNotifications.unread, []),
  });
}

export function useMarkStaffCallReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markStaffCallRead,
    onSuccess: (_response, masterSysId) => {
      queryClient.setQueryData<StaffCallNotification[]>(
        queryKeys.staffCallNotifications.unread,
        (current = []) => current.filter((notification) => notification.masterSysId !== masterSysId),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.staffCallNotifications.unread });
    },
  });
}
