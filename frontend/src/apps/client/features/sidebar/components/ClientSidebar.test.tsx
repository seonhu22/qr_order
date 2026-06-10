import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import { ClientSidebar } from './ClientSidebar';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderSidebar() {
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
        <MemoryRouter initialEntries={['/client/main']}>
          <Routes>
            <Route
              path="/client/main"
              element={<ClientSidebar activeSection={null} onClose={vi.fn()} />}
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
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('logs out through auth mutation and moves to client login', async () => {
    const user = userEvent.setup();

    renderSidebar();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('client login destination')).toBeInTheDocument();
  });
});
