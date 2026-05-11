import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import { AdminSidebar } from './AdminSidebar';

const useAdminNavigationMenusMock = vi.fn();

vi.mock('@/apps/admin/hooks/useAdminNavigationMenus', () => ({
  useAdminNavigationMenus: () => useAdminNavigationMenusMock(),
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderSidebar(initialPath = '/admin/main') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          isLoading: false,
          user: { userId: 'admin', userName: '관리자' },
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/admin/main" element={<AdminSidebar />} />
            <Route path="/admin/forbidden" element={<div>forbidden destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe('AdminSidebar', () => {
  beforeEach(() => {
    useAdminNavigationMenusMock.mockReset();
  });

  it('moves to forbidden route when menu query fails with 403', async () => {
    useAdminNavigationMenusMock.mockReturnValue({
      currentSection: null,
      currentMenus: [],
      menusBySection: {},
      isError: true,
      error: { status: 403 },
    });

    renderSidebar();

    expect(await screen.findByText('forbidden destination')).toBeInTheDocument();
  });

  it('keeps logout button visible and shows fallback text for non-403 menu errors', async () => {
    useAdminNavigationMenusMock.mockReturnValue({
      currentSection: null,
      currentMenus: [],
      menusBySection: {},
      isError: true,
      error: { status: 500 },
    });

    renderSidebar();

    expect(await screen.findByText('메뉴를 불러오지 못했습니다.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    });
  });
});
