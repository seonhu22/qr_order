import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import { useClientLayoutStore } from '@/apps/client/stores/clientLayoutStore';
import { ClientLayout } from './ClientLayout';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderLayout(initialPath = '/client/main') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          isLoading: false,
          user: { userId: 'PC002', userName: '테스트 사용자', sysPlantCd: 'ADMIN' },
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/client" element={<ClientLayout />}>
              <Route path="main" element={<div>main content</div>} />
              <Route path="store/info" element={<div>store info content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('ClientLayout', () => {
  beforeEach(() => {
    useClientLayoutStore.setState({ isSidebarOpen: false, activeSection: null });
  });

  it('renders with the initial store state', () => {
    renderLayout();

    expect(screen.getByText('main content')).toBeInTheDocument();
    expect(screen.getByLabelText('사이드 내비게이션')).toHaveClass(
      'client-layout__sidebar--closed',
    );
  });

  it('opens the sidebar and stores the section when a header section is selected', async () => {
    const user = userEvent.setup();

    renderLayout();

    const headerNav = screen.getByRole('navigation', { name: '상단 메뉴' });
    await user.click(within(headerNav).getByRole('button', { name: '매장 관리' }));

    expect(useClientLayoutStore.getState().activeSection).toBe('store');
    expect(useClientLayoutStore.getState().isSidebarOpen).toBe(true);
    expect(screen.getByLabelText('사이드 내비게이션')).not.toHaveClass(
      'client-layout__sidebar--closed',
    );
  });

  it('syncs the active section from the current route', async () => {
    renderLayout('/client/store/info');

    await waitFor(() => {
      expect(useClientLayoutStore.getState().activeSection).toBe('store');
    });
    expect(useClientLayoutStore.getState().isSidebarOpen).toBe(true);
    expect(screen.getByText('store info content')).toBeInTheDocument();
  });

  it('shows page navigation from the current route', async () => {
    renderLayout('/client/store/info');

    const pageNavigation = await screen.findByRole('navigation', { name: '현재 페이지 위치' });
    expect(within(pageNavigation).getByText('매장')).toBeInTheDocument();
    expect(within(pageNavigation).getByText('매장 정보 관리')).toBeInTheDocument();
    expect(within(pageNavigation).getByText('매장 기본 정보')).toBeInTheDocument();
  });
});
