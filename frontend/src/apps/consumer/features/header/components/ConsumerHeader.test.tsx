import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConsumerOrderFilterStore } from '@/apps/consumer/stores/consumerOrderFilterStore';
import { server } from '@/test/server';
import { ConsumerHeader } from './ConsumerHeader';
import { useConsumerParticipantStore } from '@/apps/consumer/stores/consumerParticipantStore';

beforeEach(() => {
  useConsumerOrderFilterStore.setState({ searchQuery: '', selectedCategory: '전체' });
  useConsumerParticipantStore.setState({ count: 1 });
});

describe('ConsumerHeader', () => {
  it('검색어를 API 최대 길이인 100자로 제한한다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ConsumerHeader />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    const input = screen.getByRole('textbox', { name: '메뉴 검색' });

    await userEvent.click(input);
    await userEvent.paste('가'.repeat(101));

    expect(input).toHaveValue('가'.repeat(100));
  });

  it('주문내역 배지는 메뉴 수량이 아니라 진행 상태 주문 건수를 표시한다', async () => {
    server.use(
      http.get('*/api/client/consumer/orders', () =>
        HttpResponse.json({
          success: true,
          data: {
            orders: [
              { orderId: '1', orderNo: '1', status: 'RECEIVED', totalAmount: 1, itemCount: 4, orderedAt: '', updatedAt: '' },
              { orderId: '2', orderNo: '2', status: 'COOKING', totalAmount: 1, itemCount: 3, orderedAt: '', updatedAt: '' },
              { orderId: '3', orderNo: '3', status: 'PREPARING', totalAmount: 1, itemCount: 2, orderedAt: '', updatedAt: '' },
              { orderId: '4', orderNo: '4', status: 'SERVED', totalAmount: 1, itemCount: 5, orderedAt: '', updatedAt: '' },
              { orderId: '5', orderNo: '5', status: 'CANCELLED', totalAmount: 1, itemCount: 1, orderedAt: '', updatedAt: '' },
              { orderId: '6', orderNo: '6', status: 'PAID', totalAmount: 1, itemCount: 1, orderedAt: '', updatedAt: '' },
            ],
          },
        }),
      ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ConsumerHeader />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const orderHistoryButton = screen.getByRole('button', { name: /주문내역/ });
    await waitFor(() => expect(orderHistoryButton).toHaveTextContent('주문내역4'));
  });

  it('진행 상태 주문이 10건 이상이면 주문내역 배지를 9+로 표시한다', async () => {
    server.use(
      http.get('*/api/client/consumer/orders', () =>
        HttpResponse.json({
          success: true,
          data: {
            orders: Array.from({ length: 10 }, (_, index) => ({
              orderId: String(index),
              orderNo: String(index),
              status: 'RECEIVED',
              totalAmount: 1,
              itemCount: 1,
              orderedAt: '',
              updatedAt: '',
            })),
          },
        }),
      ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ConsumerHeader />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const orderHistoryButton = screen.getByRole('button', { name: /주문내역/ });
    await waitFor(() => expect(orderHistoryButton).toHaveTextContent('주문내역9+'));
  });
});
