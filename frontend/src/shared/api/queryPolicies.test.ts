import { describe, expect, it } from 'vitest';
import { queryPolicies } from './queryPolicies';

describe('clientRealtimeStatus query policy', () => {
  it('5초 Polling, 백그라운드 중단, 포커스 재조회를 명시한다', () => {
    expect(queryPolicies.clientRealtimeStatus).toMatchObject({
      retry: false,
      staleTime: 0,
      refetchInterval: 5_000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    });
  });
});
