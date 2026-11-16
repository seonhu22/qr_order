import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { server } from '@/test/server';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { useAuth } from '@/shared/auth/AuthContext';
import { queryKeys } from '@/shared/api/queryKeys';
import { useClientUserPage } from './useClientUserPage';

function createScopeHarness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}><AuthProvider>{children}</AuthProvider></QueryClientProvider>
  );
  const hook = renderHook(() => ({ auth: useAuth(), page: useClientUserPage() }), { wrapper });
  return { client, ...hook };
}

it('does not expose store A cached users after auth/me switches to manager B in the same QueryClient', async () => {
  let actor = { userId: 'MANAGER-A', sysPlantCd: 'STORE-A', staffRole: '01' };
  let releaseB!: () => void;
  const bResponse = new Promise<void>((resolve) => { releaseB = resolve; });
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ success: true, data: actor })),
    http.get('/api/combo/common', () => HttpResponse.json([{ code: '02', name: '스태프' }])),
    http.get('/api/client/store_manage/user_manage/search', async () => {
      const requestedActor = actor;
      if (requestedActor.sysPlantCd === 'STORE-B') await bResponse;
      const rows = [{
        sysId: `${requestedActor.sysPlantCd}-STAFF`, userId: `${requestedActor.sysPlantCd}-STAFF`,
        userNm: `${requestedActor.sysPlantCd} 직원`, plantCd: requestedActor.sysPlantCd, userRole: '02',
      }];
      if (requestedActor.sysPlantCd === 'STORE-B') rows.push({
        sysId: 'FOREIGN', userId: 'FOREIGN', userNm: '타 매장 행', plantCd: 'STORE-A', userRole: '02',
      });
      return HttpResponse.json(rows);
    }),
  );
  const { client, result, unmount } = createScopeHarness();
  try {
    await waitFor(() => expect(result.current.page.data.rows.map((row) => row.plantCd)).toEqual(['STORE-A']));
    actor = { userId: 'MANAGER-B', sysPlantCd: 'STORE-B', staffRole: '01' };
    await act(async () => { await client.invalidateQueries({ queryKey: queryKeys.auth.me }); });
    await waitFor(() => expect(result.current.auth.user?.userId).toBe('MANAGER-B'));
    expect(result.current.page.data.rows).toEqual([]);
    releaseB();
    await waitFor(() => expect(result.current.page.data.rows.map((row) => row.plantCd)).toEqual(['STORE-B']));
    const cached = client.getQueryCache().findAll({ queryKey: queryKeys.clientUser.lists });
    expect(cached.some((query) => JSON.stringify(query.queryKey).includes('MANAGER-A'))).toBe(true);
    expect(cached.some((query) => JSON.stringify(query.queryKey).includes('MANAGER-B'))).toBe(true);
    await act(async () => { await client.invalidateQueries({ queryKey: queryKeys.clientUser.lists, refetchType: 'none' }); });
    expect(cached.every((query) => query.state.isInvalidated)).toBe(true);
  } finally {
    releaseB();
    unmount();
    client.clear();
  }
});

it('does not query or display users when manager identity scope is missing', async () => {
  let reads = 0;
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json({ success: true, data: { staffRole: '01', sysPlantCd: 'STORE' } })),
    http.get('/api/combo/common', () => HttpResponse.json([])),
    http.get('/api/client/store_manage/user_manage/search', () => {
      reads += 1;
      return HttpResponse.json([{ sysId: 'OLD', userId: 'OLD', userNm: '누출되면 안 됨', plantCd: 'STORE', userRole: '02' }]);
    }),
  );
  const { client, result, unmount } = createScopeHarness();
  try {
    await waitFor(() => expect(result.current.auth.isLoading).toBe(false));
    expect(reads).toBe(0);
    expect(result.current.page.data.rows).toEqual([]);
  } finally { unmount(); client.clear(); }
});
