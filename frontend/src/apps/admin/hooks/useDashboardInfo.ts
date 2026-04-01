import { useGetDashboardInfo } from '@/generated/main-controller/main-controller';
import { queryKeys } from '@/shared/api/queryKeys';

export function useDashboardInfo() {
  return useGetDashboardInfo({
    query: {
      queryKey: queryKeys.dashboard.info,
      retry: false,
      staleTime: 1000 * 60,
    },
  });
}
