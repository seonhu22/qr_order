import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { StoreInfoPage } from './StoreInfoPage';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <StoreInfoPage />
    </QueryClientProvider>,
  );
}

describe('StoreInfoPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/client/store_manage/store_info/pwd_chk', ({ request }) => {
        const pwd = new URL(request.url).searchParams.get('pwd');
        return HttpResponse.json(pwd === '1');
      }),
      http.get('/api/client/store_manage/store_info/search', () =>
        HttpResponse.json([
          {
            sysId: 'store-001',
            storeName: '쌀국수 먹고싶다',
            address: '서울특별시 강남구 테헤란로 123',
            phoneNumber: 212345678,
            emergencyPhoneNumber: 1012345678,
            email: 'info@restaurant.com',
            openTime: { hour: 11, minute: 0 },
            closeTime: { hour: 22, minute: 0 },
          },
        ]),
      ),
    );
  });

  it('shows the access authentication modal before the store form', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: '매장 정보 접근 인증' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '매장 정보' })).not.toBeInTheDocument();
  });

  it('requires a password before confirming access', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
  });

  it('renders the store info form card after password confirmation', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), '1');
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(screen.queryByRole('heading', { name: '매장 정보 접근 인증' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '매장 정보' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('쌀국수 먹고싶다')).toBeInTheDocument();
    expect(screen.getByLabelText('정보 수정')).not.toBeChecked();
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('enables the save button when 정보 수정 is checked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), '1');
    await user.click(screen.getByRole('button', { name: '확인' }));

    await screen.findByRole('heading', { name: '매장 정보' });
    await user.click(screen.getByLabelText('정보 수정'));

    expect(screen.getByLabelText('정보 수정')).toBeChecked();
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
  });
});
