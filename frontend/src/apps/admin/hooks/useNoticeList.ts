import { useGetNotice } from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';

export function useNoticeList(searchKeyword = '') {
  return useGetNotice(
    { searchKeyword },
    {
      query: {
        queryKey: queryKeys.notice.list(searchKeyword),
        retry: false,
        ...queryPolicies.adminCrudList,
      },
    },
  );
}
