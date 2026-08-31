import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import { HttpError } from '@/shared/lib/httpClient';
import { fetchConsumerSession } from '../api/consumerSessionApi';
import type { UseConsumerSessionResult } from '../types';

/**
 * 서버 HttpSession에 연결된 Consumer 방문 세션을 조회한다.
 */
export function useConsumerSession(): UseConsumerSessionResult {
  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.consumer.session,
    queryFn: ({ signal }) => fetchConsumerSession(signal),
    ...queryPolicies.consumerSession,
  });

  const session = data ?? null;
  const status =
    session?.status ??
    (error instanceof HttpError && error.status === 401 ? 'none' : error ? 'error' : 'none');

  return {
    isLoading,
    status,
    session,
  };
}
