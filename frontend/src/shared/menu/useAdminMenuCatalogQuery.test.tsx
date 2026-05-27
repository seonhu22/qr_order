import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetMenu } from '@/generated/settings-controller/settings-controller';
import { getCurrentAdminMenu, useAdminMenuCatalogQuery, useCurrentAdminMenu } from './useAdminMenuCatalogQuery';

vi.mock('@/generated/settings-controller/settings-controller', () => ({
  useGetMenu: vi.fn(),
}));

const mockedUseGetMenu = vi.mocked(useGetMenu);

const menuRows = [
  {
    sysId: 'menu-1',
    menuCd: 'commonCode',
    menuNm: '공통코드',
    parentMenuCd: 'ROOT',
    ordNo: '1',
    treeLevel: '1',
    menuUrl: '/admin/system/common-code',
  },
  {
    sysId: 'menu-2',
    menuCd: 'plantSearch',
    menuNm: '사업장 조회',
    parentMenuCd: 'ROOT',
    ordNo: '2',
    treeLevel: '1',
    menuUrl: '/admin/system/plant',
  },
  {
    sysId: 'menu-3',
    menuCd: 'noticeManage',
    menuNm: '공지사항',
    parentMenuCd: 'ROOT',
    ordNo: '3',
    treeLevel: '1',
    menuUrl: '/admin/notice/manage',
  },
] as const;

describe('useAdminMenuCatalogQuery', () => {
  beforeEach(() => {
    mockedUseGetMenu.mockReset();
    mockedUseGetMenu.mockReturnValue({
      data: [...menuRows],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it('builds a shared catalog from the menu list query', () => {
    const { result } = renderHook(() => useAdminMenuCatalogQuery(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    expect(result.current.catalogItems).toHaveLength(3);
    expect(result.current.catalog.byMenuCd.get('commonCode')?.menuNm).toBe('공통코드');
    expect(result.current.catalog.byPath.get('/admin/system/plant')?.menuCd).toBe('plantSearch');
  });

  it('calculates current menu from pathname using exact or closest parent path', () => {
    const { result } = renderHook(() => useCurrentAdminMenu(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/admin/system/plant/new']}>{children}</MemoryRouter>
      ),
    });

    expect(result.current.currentMenu?.menuCd).toBe('plantSearch');
  });

  it('also exposes the pure current menu resolver for non-hook use', () => {
    const { result } = renderHook(() => useAdminMenuCatalogQuery(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    expect(getCurrentAdminMenu('/admin/notice/manage', result.current.catalogItems)?.menuCd).toBe(
      'noticeManage',
    );
  });
});
