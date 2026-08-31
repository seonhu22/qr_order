import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConsumerSession } from '@/apps/consumer/features/session/hooks/useConsumerSession';
import { ConsumerSessionGuard } from './ConsumerSessionGuard';

vi.mock('@/apps/consumer/features/session/hooks/useConsumerSession', () => ({
  useConsumerSession: vi.fn(),
}));

const useConsumerSessionMock = vi.mocked(useConsumerSession);

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="pathname">{location.pathname}</span>;
}

function renderGuard(initialPath = '/consumer/order') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/consumer/order"
          element={
            <ConsumerSessionGuard>
              <div>protected order content</div>
            </ConsumerSessionGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConsumerSessionGuard', () => {
  beforeEach(() => {
    useConsumerSessionMock.mockReset();
  });

  it('renders an empty checking frame while loading', () => {
    useConsumerSessionMock.mockReturnValue({ isLoading: true, status: 'none', session: null });
    renderGuard();
    expect(screen.getByLabelText('세션 확인 중')).toBeInTheDocument();
    expect(screen.queryByText('protected order content')).not.toBeInTheDocument();
  });

  it('renders protected content for an active session', () => {
    useConsumerSessionMock.mockReturnValue({
      isLoading: false,
      status: 'active',
      session: {
        consumerSessionId: 'visit-001',
        status: 'active',
        sysPlantCd: 'ADMIN',
        storeName: '테스트 매장',
        tableSysId: 'table-001',
        tableName: '1번 테이블',
        tableNum: 1,
        tableQty: 4,
        orderingAllowed: true,
        orderingBlockedReason: null,
        startedAt: '2026-09-01 09:00:00',
      },
    });
    renderGuard();
    expect(screen.getByText('protected order content')).toBeInTheDocument();
  });

  it.each([
    ['none', '연결된 주문 세션이 없습니다.'],
    ['expired', '주문 세션이 만료되었습니다.'],
    ['closed', '주문이 마감되었습니다.'],
    ['error', '세션 정보를 불러오지 못했습니다.'],
  ] as const)('renders the %s guidance without protected content', (status, title) => {
    useConsumerSessionMock.mockReturnValue({ isLoading: false, status, session: null });
    renderGuard();
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.queryByText('protected order content')).not.toBeInTheDocument();
  });

  it('never navigates to an admin/client login path', () => {
    useConsumerSessionMock.mockReturnValue({ isLoading: false, status: 'expired', session: null });

    renderGuard();

    expect(screen.getByTestId('pathname')).toHaveTextContent('/consumer/order');
  });
});
