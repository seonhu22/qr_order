import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import { ClientMenuAccessGuard } from './ClientMenuAccessGuard';

function renderGuard(staffRole?: string) {
  return render(
    <AuthContext.Provider value={{ isAuthenticated: true, isLoading: false,
      user: { role: 'ADMIN', staffRole }, signIn: vi.fn(), signOut: vi.fn() }}>
      <MemoryRouter initialEntries={['/client/menu/info/option']}>
        <Routes>
          <Route element={<ClientMenuAccessGuard />}>
            <Route path="/client/menu/info/option" element={<h1>protected options</h1>} />
          </Route>
          <Route path="/client/main" element={<h1>safe main</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('Client menu direct URL guard', () => {
  it('renders the protected page for manager 01', () => {
    renderGuard('01');
    expect(screen.getByRole('heading', { name: 'protected options' })).toBeInTheDocument();
  });
  it.each(['02', undefined, 'UNKNOWN'])('redirects %s before rendering the protected page', (role) => {
    renderGuard(role);
    expect(screen.getByRole('heading', { name: 'safe main' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'protected options' })).not.toBeInTheDocument();
  });
});
