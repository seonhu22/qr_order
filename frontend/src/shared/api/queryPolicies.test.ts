import { describe, expect, it } from 'vitest';
import { queryPolicies } from './queryPolicies';

describe('clientRealtimeStatus query policy', () => {
  it('SSE 갱신을 사용하고 포커스 복귀 시 안전망으로 재조회한다', () => {
    expect(queryPolicies.clientRealtimeStatus).toMatchObject({
      retry: false,
      staleTime: 0,
      refetchOnWindowFocus: true,
    });
    expect(queryPolicies.clientRealtimeStatus).not.toHaveProperty('refetchInterval');
  });
});
