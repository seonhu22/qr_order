import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import AppRoutes from './AppRoutes';

type AuthTestState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: Record<string, unknown> | null;
};

const defaultAuthState: AuthTestState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="pathname">{location.pathname}</span>;
}

function renderRoutes(initialPath: string, authState: Partial<AuthTestState> = {}) {
  const renderTree = (nextAuthState: Partial<AuthTestState> = {}) => (
    <QueryClientProvider client={createQueryClient()}>
      <AuthContext.Provider
        value={{
          ...defaultAuthState,
          ...nextAuthState,
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRoutes />
          <LocationProbe />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  const view = render(renderTree(authState));

  return {
    ...view,
    rerenderWithAuth: (nextAuthState: Partial<AuthTestState>) =>
      view.rerender(renderTree(nextAuthState)),
  };
}

describe('AppRoutes auth redirect', () => {
  it('redirects the root path to client login by default', async () => {
    renderRoutes('/');

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/client/login');
    });
  });

  it('redirects unknown paths to client login by default', async () => {
    renderRoutes('/unknown');

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/client/login');
    });
  });

  it('redirects protected client routes to client login', async () => {
    renderRoutes('/client/main');

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/client/login');
    });
  });

  it('redirects protected admin routes to admin login', async () => {
    renderRoutes('/admin/main');

    await waitFor(() => {
      expect(screen.getByTestId('pathname')).toHaveTextContent('/admin/login');
    });
  });

  it('keeps the client signup step mounted while auth state is loading', () => {
    const { rerenderWithAuth } = renderRoutes('/client/login');

    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByRole('heading', { name: '개인정보 수집·이용 동의' })).toBeInTheDocument();

    rerenderWithAuth({ isLoading: true });

    expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '개인정보 수집·이용 동의' })).toBeInTheDocument();
  });

  it('shows the loading screen on protected routes while auth state is loading', () => {
    renderRoutes('/client/main', { isLoading: true });

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('does not block the public QR entry route while auth state is loading', () => {
    renderRoutes('/qr/valid-id', { isLoading: true });

    expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
    expect(screen.getByLabelText('QR 코드 인증 중')).toBeInTheDocument();
  });

  it('does not block the consumer order route while auth state is loading', () => {
    renderRoutes('/consumer/order', { isLoading: true });

    expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '전체' })).toBeInTheDocument();
  });
});
