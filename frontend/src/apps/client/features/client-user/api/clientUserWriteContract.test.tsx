import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { server } from '@/test/server';
import { useSaveClientUserMutation } from './clientUserApi';

function renderMutation() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(useSaveClientUserMutation, { wrapper });
}

it('serializes a new staff account without trusting a draft store or identifier', async () => {
  const requests: unknown[] = [];
  server.use(http.post('/api/client/store_manage/user_manage/new', async ({ request }) => {
    requests.push(await request.json());
    return HttpResponse.json({ success: true });
  }));
  const { result } = renderMutation();
  await act(async () => { await result.current.mutateAsync({
    id: 'DRAFT', sysId: 'UNTRUSTED', userId: 'new-staff', userName: '직원', authorityCode: '02', plantCd: 'FORGED',
  }, true); });
  expect(requests).toEqual([{ userId: 'new-staff', userNm: '직원', userRole: '02' }]);
});

it('serializes a name update without role, account ID or store changes', async () => {
  const requests: unknown[] = [];
  server.use(http.post('/api/client/store_manage/user_manage/update', async ({ request }) => {
    requests.push(await request.json());
    return HttpResponse.json({ success: true });
  }));
  const { result } = renderMutation();
  await act(async () => { await result.current.mutateAsync({
    id: 'ROW', sysId: 'STAFF-ID', userId: 'immutable-id', userName: '수정 이름', authorityCode: '02', plantCd: 'STORE',
  }, false); });
  expect(requests).toEqual([{ sysId: 'STAFF-ID', userNm: '수정 이름' }]);
});

it('rejects an administrator draft before sending any write request', async () => {
  const requests: string[] = [];
  server.use(http.post('/api/client/store_manage/user_manage/:action', ({ request }) => {
    requests.push(request.url);
    return HttpResponse.json({ success: true });
  }));
  const { result } = renderMutation();
  for (const isCreate of [true, false]) {
    await act(async () => {
      await expect(result.current.mutateAsync({
        id: 'ADMIN', sysId: 'ADMIN', userId: 'admin', userName: '관리자', authorityCode: '01',
      }, isCreate)).rejects.toThrow('스태프');
    });
  }
  expect(requests).toEqual([]);
});
