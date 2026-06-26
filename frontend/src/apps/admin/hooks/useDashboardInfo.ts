import { useGetDashboardInfo } from '@/generated/main-controller/main-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';

export function useDashboardInfo() {
  return useGetDashboardInfo({
    query: {
      queryKey: queryKeys.dashboard.info,
      ...queryPolicies.dashboard,
    },
  });
}
