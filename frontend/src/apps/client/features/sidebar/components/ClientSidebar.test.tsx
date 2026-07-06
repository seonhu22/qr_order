import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';
import { ClientSidebar } from './ClientSidebar';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderSidebar(
  initialPath = '/client/main',
  user: Record<string, unknown> = {
    userId: 'PC002',
    userName: '테스트 사용자',
    staffRole: '01',
    role: 'STAFF',
    sysPlantCd: 'ADMIN',
  },
) {
  useClientLayoutStore.setState({ isSidebarOpen: true, activeSection: null });

  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          isLoading: false,
          user,
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route
              path="/client/main"
              element={<ClientSidebar />}
            />
            <Route
              path="/client/store/info/base"
              element={<ClientSidebar />}
            />
            <Route path="/client/login" element={<div>client login destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('ClientSidebar', () => {
  it('shows the user information from auth/me', () => {
    renderSidebar();

    expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
    expect(screen.getByText('관리자')).toBeInTheDocument();
  });

  it('shows staff when auth/me only has role: staff', () => {
    renderSidebar('/client/main', {
      userId: 'staff001',
      userName: '스태프 사용자',
      role: 'staff',
      sysPlantCd: 'ADMIN',
    });

    expect(screen.getByText('스태프 사용자')).toBeInTheDocument();
    expect(screen.getByText('스태프')).toBeInTheDocument();
  });

  it('uses staffRole before role for the client role label', () => {
    renderSidebar('/client/main', {
      userId: 'owner001',
      userName: '관리자 사용자',
      role: 'STAFF',
      staffRole: '01',
      sysPlantCd: 'ADMIN',
    });

    expect(screen.getByText('관리자 사용자')).toBeInTheDocument();
    expect(screen.getByText('관리자')).toBeInTheDocument();
  });

  it('shows all top-level menus while keeping unmatched groups folded', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: '매장' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '주문' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '결제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '게시판' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '매장 정보 관리' })).not.toBeInTheDocument();
  });

  it('opens the matching depth2 group for the current url', async () => {
    renderSidebar('/client/store/info/base');

    expect(await screen.findByRole('button', { name: '매장 정보 관리' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '매장 기본 정보' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('logs out through auth mutation and moves to client login', async () => {
    const user = userEvent.setup();

    renderSidebar();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('client login destination')).toBeInTheDocument();
  });
});
