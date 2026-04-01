// src/shared/auth/hooks/useCurrentUser.ts
import { useGetCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * 현재 로그인한 사용자의 정보를 조회하는 커스텀 훅
 *
 * @description
 * - React Query의 useQuery를 사용하여 현재 사용자 정보를 가져옵니다.
 * - queryKey는 `queryKeys.auth.me`로 설정되어 있으며, 실패 시 재시도하지 않습니다.
 * - staleTime: 데이터는 5분 동안 신선한 상태로 유지됩니다.
 *
 * @returns 현재 사용자 정보 및 로딩 상태를 포함한 React Query 결과 객체
 */
export function useCurrentUser() {
  return useGetCurrentUser({
    query: {
      queryKey: queryKeys.auth.me,
      retry: false,
      staleTime: 1000 * 60 * 5,
    },
  });
}
