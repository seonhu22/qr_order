import { useGetNotice } from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';

export function useNoticeList(searchKeyword = '') {
  return useGetNotice(
    { searchKeyword },
    {
      query: {
        queryKey: queryKeys.notice.list(searchKeyword),
        retry: false,
        staleTime: 1000 * 60,
      },
    },
  );
}
