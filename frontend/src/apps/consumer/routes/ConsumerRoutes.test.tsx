import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { consumerRoutes } from './ConsumerRoutes';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function ConsumerRoutesElement() {
  return useRoutes(consumerRoutes);
}

function renderConsumerRoutes(initialEntry: string | { pathname: string; state?: unknown }) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ConsumerRoutesElement />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('consumerRoutes', () => {
  it('shows the Consumer 404 for an unknown path under an active session, not the global fallback', async () => {
    renderConsumerRoutes({
      pathname: '/consumer/unknown',
      state: {
        qrTableInfo: {
          sysId: 'table-001',
          tableName: '창가 1번',
          tableNum: 1,
          tableQty: 4,
          sysPlantCd: 'ADMIN',
        },
      },
    });

    expect(
      await screen.findByRole('heading', { name: '페이지를 찾을 수 없습니다.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '주문 화면으로 이동' })).toBeInTheDocument();
  });

  // ConsumerSessionGuard는 실제 세션 조회 API가 없어 지금은 비활성화돼 있다(SESSION_GUARD_ENABLED).
  // 그래서 /consumer/order는 QR 세션 없이 열어도 주문 화면을 그대로 보여준다.
  it('renders the order shell when /consumer/order is opened without a prior QR scan', async () => {
    renderConsumerRoutes('/consumer/order');

    expect(await screen.findByRole('tab', { name: '전체' })).toBeInTheDocument();
  });
});
