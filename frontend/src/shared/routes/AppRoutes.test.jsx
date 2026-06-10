import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import AppRoutes from './AppRoutes';

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

function renderRoutes(initialPath) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthContext.Provider
        value={{
          isAuthenticated: false,
          isLoading: false,
          user: null,
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRoutes />
          <LocationProbe />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
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
});
