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

// 실제 세션 조회 API가 없어 SESSION_GUARD_ENABLED가 false인 동안은 세션 상태와 무관하게
// children을 그대로 렌더링한다 — 이 테스트는 그 현재 동작을 고정한다.
// API가 연동돼 가드를 다시 켜면, 상태별 분기(none/expired/closed → ConsumerStatusScreen)를
// 검증하는 테스트를 이 자리에 되살린다.
describe('ConsumerSessionGuard', () => {
  beforeEach(() => {
    useConsumerSessionMock.mockReset();
  });

  it.each([
    ['loading', { isLoading: true, status: 'none' as const, session: null }],
    [
      'active',
      {
        isLoading: false,
        status: 'active' as const,
        session: { sysPlantCd: 'ADMIN', tableSysId: 'table-001' },
      },
    ],
    ['none', { isLoading: false, status: 'none' as const, session: null }],
    ['expired', { isLoading: false, status: 'expired' as const, session: null }],
    ['closed', { isLoading: false, status: 'closed' as const, session: null }],
  ])(
    'renders children regardless of session status (%s) while the guard is disabled',
    (_label, mockValue) => {
      useConsumerSessionMock.mockReturnValue(mockValue);

      renderGuard();

      expect(screen.getByText('protected order content')).toBeInTheDocument();
    },
  );

  it('never navigates to an admin/client login path', () => {
    useConsumerSessionMock.mockReturnValue({ isLoading: false, status: 'expired', session: null });

    renderGuard();

    expect(screen.getByTestId('pathname')).toHaveTextContent('/consumer/order');
  });
});
