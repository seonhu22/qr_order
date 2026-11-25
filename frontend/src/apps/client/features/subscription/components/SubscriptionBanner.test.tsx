import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import { AuthContext } from '@/shared/auth/AuthContext';
import { PENDING_OWNER_VIEW } from '../mock/subscriptionMock';
import { SubscriptionBanner } from './SubscriptionBanner';

function renderBanner(staffRole: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ isAuthenticated: true, isLoading: false, user: { staffRole },
        signIn: vi.fn(), signOut: vi.fn() }}>
        <MemoryRouter>
          <SubscriptionBanner />
          <p>page</p>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('SubscriptionBanner', () => {
  it('tells a 02 owner what opens after payment', async () => {
    server.use(http.get('/api/client/subscription', () => HttpResponse.json(PENDING_OWNER_VIEW)));
    renderBanner('02');
    expect(await screen.findByRole('status')).toHaveTextContent('구독 결제 후 메뉴/직원 관리가 열립니다.');
    expect(screen.getByRole('link', { name: '구독 정보 보기' })).toHaveAttribute('href', '/client/subscription');
  });

  it('warns about an expired card (console card expiry)', async () => {
    server.use(http.get('/api/client/subscription', () => HttpResponse.json({
      ...PENDING_OWNER_VIEW, status: 'ACTIVE', owner: false, paymentMethodStatus: 'EXPIRED',
    })));
    renderBanner('02');
    expect(await screen.findByRole('status')).toHaveTextContent('등록된 카드가 만료되었습니다.');
  });

  it('renders nothing for stores without a subscription', async () => {
    renderBanner('01');
    await screen.findByText('page');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
