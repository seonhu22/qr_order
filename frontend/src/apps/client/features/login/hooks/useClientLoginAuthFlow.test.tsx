import type { FormEvent, ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import { useResultModalFlow } from '@/shared/hooks/useResultModalFlow';
import { useClientLoginAuthFlow } from './useClientLoginAuthFlow';

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const goToStep = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
  );
  const view = renderHook(() => {
    const modal = useResultModalFlow();
    return { ...useClientLoginAuthFlow({ modal, goToStep }), modal };
  }, { wrapper });
  act(() => {
    view.result.current.login.onUserIdChange('test-user');
    view.result.current.login.onUserPasswordChange('Wrong-password!');
  });
  act(() => {
    view.result.current.login.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>);
  });
  return { ...view, goToStep };
}

describe('Client login lock notice uses the server contract', () => {
  beforeEach(() => localStorage.clear());

  it.each([1, 2, 3, 4])('count %i remains an inline failure without a lock notice', async (count) => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ success: false, data: count, message: '비밀번호가 맞지 않습니다.' }, { status: 401 })));
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.login.loginError).toBe('비밀번호가 맞지 않습니다.'));
    expect(result.current.modal.modalProps.open).toBe(false);
    expect(result.current.login.userPassword).toBe('Wrong-password!');
  });

  it.each([[401, 5], [200, { password_fail_cnt: 5 }]] as const)('status %i count 5 opens one notice and clears the password', async (status, data) => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ success: false, data, message: '비밀번호가 맞지 않습니다.' }, { status })));
    const { result, goToStep } = renderLogin();
    await waitFor(() => expect(result.current.modal.modalProps.open).toBe(true));
    expect(result.current.modal.modalProps.title).toBe('로그인 제한 안내');
    expect(result.current.login.userPassword).toBe('');
    expect(result.current.login.loginError).toBe('');
    expect(goToStep).not.toHaveBeenCalled();
  });

  it('recognizes an existing locked account message without a count', async () => {
    const message = '해당 계정은 비밀번호 5회 초과 오류로 사용 중지된 상태입니다.';
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ success: false, message }, { status: 401 })));
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.modal.modalProps.description).toBe(message));
    expect(result.current.modal.modalProps.open).toBe(true);
  });

  it('does not label a server failure as an account lock', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ success: false, message: '서버 오류' }, { status: 500 })));
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.login.loginError).toBe('서버 오류'));
    expect(result.current.modal.modalProps.open).toBe(false);
  });
});
