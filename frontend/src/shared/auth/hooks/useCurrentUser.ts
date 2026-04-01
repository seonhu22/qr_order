// src/shared/auth/hooks/useCurrentUser.ts
import { useGetCurrentUser } from '@/generated/auth-api-controller/auth-api-controller';
import { queryKeys } from '@/shared/api/queryKeys';

export function useCurrentUser() {
  return useGetCurrentUser({
    query: {
      queryKey: queryKeys.auth.me,
      retry: false,
      staleTime: 1000 * 60 * 5,
    },
  });
}
