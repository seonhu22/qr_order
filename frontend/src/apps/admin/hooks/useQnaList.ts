import { useGetQna } from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';

export function useQnaList(searchKeyword = '') {
  return useGetQna(
    { searchKeyword },
    {
      query: {
        queryKey: queryKeys.qna.list(searchKeyword),
        retry: false,
        staleTime: 1000 * 60,
      },
    },
  );
}
