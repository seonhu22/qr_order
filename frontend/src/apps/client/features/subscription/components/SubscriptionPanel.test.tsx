import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import { PENDING_OWNER_VIEW } from '../mock/subscriptionMock';
import { SubscriptionPanel } from './SubscriptionPanel';

function renderPanel(navigateTo = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SubscriptionPanel navigateTo={navigateTo} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return navigateTo;
}

describe('SubscriptionPanel', () => {
  it('lets the owner pick a plan and opens the provider checkout url', async () => {
    let body: unknown;
    server.use(
      http.get('/api/client/subscription', () => HttpResponse.json(PENDING_OWNER_VIEW)),
      http.post('/api/client/subscription/checkout', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ provider: 'fake', launch: { redirectUrl: 'http://localhost:8080/fake-pg/checkout?token=t' } });
      }),
    );
    const navigateTo = renderPanel();
    await userEvent.click(await screen.findByRole('button', { name: '결제하기' }));
    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith('http://localhost:8080/fake-pg/checkout?token=t'));
    expect(body).toEqual({ planSysId: 'PLAN-1' });
    expect(screen.getByRole('combobox', { name: '플랜' })).toHaveValue('PLAN-1');
    expect(screen.getByText('결제 이력이 없습니다.')).toBeInTheDocument();
  });

  it('shows the server reason when checkout is refused', async () => {
    server.use(
      http.get('/api/client/subscription', () => HttpResponse.json(PENDING_OWNER_VIEW)),
      http.post('/api/client/subscription/checkout', () =>
        HttpResponse.json({ success: false, message: '이미 결제된 구독입니다.' }, { status: 409 })),
    );
    const navigateTo = renderPanel();
    await userEvent.click(await screen.findByRole('button', { name: '결제하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 결제된 구독입니다.');
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('is read-only for staff and never asks for invoices', async () => {
    const invoices = vi.fn();
    server.use(
      http.get('/api/client/subscription', () => HttpResponse.json({
        ...PENDING_OWNER_VIEW, owner: false, canCheckout: false, canCancel: false, plans: [],
      })),
      http.get('/api/client/subscription/invoices', () => { invoices(); return HttpResponse.json([]); }),
    );
    renderPanel();
    expect(await screen.findByText('결제와 해지는 매장 대표만 할 수 있습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '결제하기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '해지 예약' })).not.toBeInTheDocument();
    expect(invoices).not.toHaveBeenCalled();
  });

  it('schedules cancellation after confirmation and shows the fixed end', async () => {
    let state = {
      ...PENDING_OWNER_VIEW, status: 'ACTIVE', canCheckout: false, paidThroughAt: '2026-12-25T03:00:00Z',
      paymentMethodStatus: 'ACTIVE',
    };
    server.use(
      http.get('/api/client/subscription', () => HttpResponse.json(state)),
      http.post('/api/client/subscription/cancel', () => {
        state = { ...state, status: 'CANCEL_SCHEDULED', endAt: '2026-12-25T03:00:00Z', canCancel: false };
        return HttpResponse.json(state);
      }),
    );
    renderPanel();
    await userEvent.click(await screen.findByRole('button', { name: '해지 예약' }));
    const dialogButtons = await screen.findAllByRole('button', { name: '해지 예약' });
    await userEvent.click(dialogButtons[dialogButtons.length - 1]);
    expect(await screen.findByText('해지 예약', { selector: '.subscription-card__status' })).toBeInTheDocument();
    expect(screen.getByText(/2026-12-25 12:00에 구독이 끝납니다/)).toBeInTheDocument();
  });

  it('shows an empty state for stores without a subscription', async () => {
    renderPanel();
    expect(await screen.findByText('구독 정보가 없습니다.')).toBeInTheDocument();
  });
});
