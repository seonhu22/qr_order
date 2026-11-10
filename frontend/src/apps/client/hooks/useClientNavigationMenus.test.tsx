import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/shared/auth/AuthContext';
import { useClientNavigationMenus } from './useClientNavigationMenus';

vi.mock('@/shared/menu/useAdminMenuCatalogQuery', () => ({
  useAdminMenuCatalogQuery: () => ({ catalogItems: [] }),
}));

describe('navigation uses current session authority', () => {
  it('updates menu visibility when staffRole changes and ignores global role fallback', () => {
    let staffRole: string | undefined = '01';
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={{ isAuthenticated: true, isLoading: false,
        user: { userId: 'test', role: 'ADMIN', staffRole }, signIn: vi.fn(), signOut: vi.fn() }}>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthContext.Provider>
    );
    const { result, rerender } = renderHook(useClientNavigationMenus, { wrapper });
    const paths = () => Object.values(result.current.menusBySection).flatMap((menus) => menus.flatMap((menu) => menu.groups.flatMap((group) => group.items.map((item) => item.path))));
    expect(paths()).toContain('/client/menu/info/management');
    staffRole = '02';
    rerender();
    expect(paths()).not.toContain('/client/menu/info/management');
    expect(paths()).toContain('/client/menu/info/staff-call');
    staffRole = undefined;
    rerender();
    expect(paths()).not.toContain('/client/menu/info/option');
  });
});
