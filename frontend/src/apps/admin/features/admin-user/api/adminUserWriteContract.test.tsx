import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { server } from '@/test/server';
import { buildAdminUserRequest, mapToAdminUserModel, useSaveAdminUsersMutation } from './adminUserApi';

it('serializes an existing stored plant unchanged when updating only the user name', async () => {
  const requests: unknown[] = [];
  server.use(http.post('/api/system/settings/adminuser/save', async ({ request }) => {
    requests.push(await request.json());
    return HttpResponse.json({ success: true });
  }));
  const original = mapToAdminUserModel({
    sysId: 'user-1', userId: 'admin01', userNm: '원래 이름',
    plantCd: 'STORED-PLANT', plantNm: '저장된 사업장',
  });
  const payload = buildAdminUserRequest([{ ...original, userName: '수정된 이름' }], [original]);
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(useSaveAdminUsersMutation, { wrapper });
  await act(async () => { await result.current.mutateAsync(payload); });
  expect(requests).toEqual([{
    newItems: [], delItems: [],
    updateItems: [{ sysId: 'user-1', userId: 'admin01', userNm: '수정된 이름', plantCd: 'STORED-PLANT' }],
  }]);
});
