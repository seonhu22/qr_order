import { act, render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import { queryKeys } from '@/shared/api/queryKeys';
import { PENDING_OWNER_VIEW } from '../mock/subscriptionMock';
import { RECONCILE_COOLDOWN_MS, SubscriptionResultPanel } from './SubscriptionResultPanel';

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SubscriptionResultPanel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return invalidate;
}

afterEach(() => vi.useRealTimers());

describe('SubscriptionResultPanel', () => {
  it('reconciles, then refetches /api/auth/me, and locks the button for 10 seconds', async () => {
    let calls = 0;
    server.use(
      http.get('/api/client/subscription', () => HttpResponse.json(calls ? { ...PENDING_OWNER_VIEW, status: 'ACTIVE' } : PENDING_OWNER_VIEW)),
      http.post('/api/client/subscription/reconcile', () => {
        calls += 1;
        return HttpResponse.json({ ...PENDING_OWNER_VIEW, status: 'ACTIVE' });
      }),
      http.get('/api/client/subscription/invoices', () => HttpResponse.json([])),
    );
    const invalidate = renderPanel();
    const button = await screen.findByRole('button', { name: '결제 결과 재확인' });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.click(button);
    expect(await screen.findByRole('status')).toHaveTextContent('결제가 확인되었습니다.');
    expect(calls).toBe(1);
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.auth.me }));
    expect(screen.getByRole('button', { name: '결제 결과 재확인' })).toBeDisabled();
    act(() => { vi.advanceTimersByTime(RECONCILE_COOLDOWN_MS); });
    await waitFor(() => expect(screen.getByRole('button', { name: '결제 결과 재확인' })).toBeEnabled());
  });

  it('shows the throttle message from the server', async () => {
    server.use(
      http.get('/api/client/subscription', () => HttpResponse.json(PENDING_OWNER_VIEW)),
      http.post('/api/client/subscription/reconcile', () =>
        HttpResponse.json({ success: false, message: '10초 뒤에 다시 확인해 주세요.' }, { status: 429 })),
    );
    renderPanel();
    fireEvent.click(await screen.findByRole('button', { name: '결제 결과 재확인' }));
    expect(await screen.findByRole('status')).toHaveTextContent('10초 뒤에 다시 확인해 주세요.');
  });

  it('staff see the result without the recheck button', async () => {
    server.use(http.get('/api/client/subscription', () => HttpResponse.json({ ...PENDING_OWNER_VIEW, owner: false })));
    renderPanel();
    expect(await screen.findByText('결제 결과')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '결제 결과 재확인' })).not.toBeInTheDocument();
  });
});
