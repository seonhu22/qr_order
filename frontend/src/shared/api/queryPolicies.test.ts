import { describe, expect, it } from 'vitest';
import { queryPolicies, staleTimes } from './queryPolicies';

describe('queryPolicies', () => {
  it('defines client app cache policies by screen freshness needs', () => {
    expect(queryPolicies.clientCrudList.staleTime).toBe(staleTimes.short);
    expect(queryPolicies.clientReferenceData.staleTime).toBe(staleTimes.normal);
    expect(queryPolicies.clientRealtimeStatus.staleTime).toBe(staleTimes.instant);
  });
});
