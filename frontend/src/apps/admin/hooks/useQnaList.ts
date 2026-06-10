import { useGetQna } from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';

export function useQnaList(searchKeyword = '') {
  return useGetQna(
    { searchKeyword },
    {
      query: {
        queryKey: queryKeys.qna.list(searchKeyword),
        ...queryPolicies.adminCrudList,
        retry: false,
      },
    },
  );
}
