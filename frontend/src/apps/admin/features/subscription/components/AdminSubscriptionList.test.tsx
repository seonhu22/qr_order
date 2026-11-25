import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { ADMIN_SUBSCRIPTION_DETAIL_MOCK, ADMIN_SUBSCRIPTION_LIST_MOCK } from '../mock/adminSubscriptionMock';
import { AdminSubscriptionList } from './AdminSubscriptionList';

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><AdminSubscriptionList /></QueryClientProvider>);
}

describe('AdminSubscriptionList', () => {
  it('lists subscriptions with problem counts and the mismatch webhooks', async () => {
    const urls: string[] = [];
    server.use(http.get('/api/system/subscriptions', ({ request }) => {
      urls.push(new URL(request.url).search);
      return HttpResponse.json(ADMIN_SUBSCRIPTION_LIST_MOCK);
    }));
    renderList();
    const table = await screen.findByRole('table', { name: '구독 목록' });
    expect(within(table).getByText('대표 컴퍼니')).toBeInTheDocument();
    expect(within(table).getByText('해지 예약')).toBeInTheDocument();
    expect(within(table).getByText('구독 01')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '연결 불일치 웹훅' })).toHaveTextContent('inv_9');
    expect(urls[0]).toBe('');

    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '구독 상태' }), 'ACTIVE');
    await waitFor(() => expect(urls.at(-1)).toBe('?status=ACTIVE&problemOnly=true'));
  });

  it('opens detail, flags problem invoices, refunds and ends the subscription', async () => {
    let refundBody: unknown;
    let ended = false;
    server.use(
      http.get('/api/system/subscriptions', () => HttpResponse.json(ADMIN_SUBSCRIPTION_LIST_MOCK)),
      http.get('/api/system/subscriptions/SUB-A', () => HttpResponse.json(ADMIN_SUBSCRIPTION_DETAIL_MOCK)),
      http.post('/api/system/subscriptions/SUB-A/refund', async ({ request }) => {
        refundBody = await request.json();
        return HttpResponse.json({ invoiceSysId: 'INV-2', requestedAmount: 10000, message: '환불을 요청했습니다. 결제사 알림으로 반영됩니다.' });
      }),
      http.post('/api/system/subscriptions/SUB-A/end', () => {
        ended = true;
        return HttpResponse.json({ ...ADMIN_SUBSCRIPTION_DETAIL_MOCK, canEnd: false });
      }),
    );
    renderList();
    await userEvent.click(await screen.findByRole('button', { name: '대표 컴퍼니' }));
    const invoices = await screen.findByRole('table', { name: '인보이스' });
    expect(within(invoices).getByText('문제: 해지 뒤 결제')).toBeInTheDocument();

    const amount = within(invoices).getByRole('textbox', { name: 'inv_2 환불 금액' });
    await userEvent.clear(amount);
    await userEvent.type(amount, '10000');
    await userEvent.click(within(invoices).getAllByRole('button', { name: '환불' })[0]);
    expect(await screen.findByText('환불을 요청했습니다. 결제사 알림으로 반영됩니다.')).toBeInTheDocument();
    expect(refundBody).toEqual({ invoiceSysId: 'INV-2', amount: 10000 });

    await userEvent.click(screen.getByRole('button', { name: '즉시 종료' }));
    const confirm = await screen.findAllByRole('button', { name: '즉시 종료' });
    await userEvent.click(confirm[confirm.length - 1]);
    expect(await screen.findByText('구독을 종료했습니다.')).toBeInTheDocument();
    expect(ended).toBe(true);
  });

  it('shows the server reason when a refund is refused', async () => {
    server.use(
      http.get('/api/system/subscriptions', () => HttpResponse.json(ADMIN_SUBSCRIPTION_LIST_MOCK)),
      http.get('/api/system/subscriptions/SUB-A', () => HttpResponse.json(ADMIN_SUBSCRIPTION_DETAIL_MOCK)),
      http.post('/api/system/subscriptions/SUB-A/refund', () =>
        HttpResponse.json({ success: false, message: '환불 금액은 1원 이상 29000원 이하입니다.' }, { status: 400 })),
    );
    renderList();
    await userEvent.click(await screen.findByRole('button', { name: '대표 컴퍼니' }));
    const invoices = await screen.findByRole('table', { name: '인보이스' });
    await userEvent.click(within(invoices).getAllByRole('button', { name: '환불' })[0]);
    expect(await screen.findByText('환불 금액은 1원 이상 29000원 이하입니다.')).toBeInTheDocument();
  });
});
