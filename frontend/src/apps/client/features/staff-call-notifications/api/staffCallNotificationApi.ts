import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { httpClient } from '@/shared/lib/httpClient';

export type StaffCallNotification = {
  sysId: string;
  callCd: string;
  callNm: string;
  description?: string | null;
  insertDatetime: string;
};

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
