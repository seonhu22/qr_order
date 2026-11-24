import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import { MainPage } from './MainPage';

function renderMainPage(staffRole?: string) {
  render(
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        isLoading: false,
        user: { staffRole, role: 'ADMIN' },
        signIn: vi.fn(),
        signOut: vi.fn(),
      }}
    >
      <MemoryRouter>
        <MainPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('MainPage', () => {
  it('관리자에게 메뉴 관리 바로가기를 표시한다', () => {
    renderMainPage('01');

    expect(screen.getByRole('link', { name: '메뉴 관리' }))
      .toHaveAttribute('href', '/client/menu/info/management');
  });

  it.each(['02', undefined])('staffRole이 %s이면 공통 바로가기만 표시한다', (staffRole) => {
    renderMainPage(staffRole);

    expect(screen.queryByRole('link', { name: '메뉴 관리' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '주문 상태 관리' }))
      .toHaveAttribute('href', '/client/order/status/management');
    expect(screen.getByRole('link', { name: '결제 목록 조회' }))
      .toHaveAttribute('href', '/client/payment/status/list');
    expect(screen.getByRole('link', { name: '직원호출 관리' }))
      .toHaveAttribute('href', '/client/menu/info/staff-call');
  });
});
