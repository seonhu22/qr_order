import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetMenu } from '@/generated/settings-controller/settings-controller';
import { useInsertMenuOpenAccessLog } from '@/generated/log-controller/log-controller';
import { useAdminMenuStore } from '@/apps/admin/stores/adminMenuStore';
import { useAdminMenuOpenAccessLog } from './useAdminMenuOpenAccessLog';

const mutateMock = vi.fn();

vi.mock('@/generated/settings-controller/settings-controller', () => ({
  useGetMenu: vi.fn(),
}));

vi.mock('@/generated/log-controller/log-controller', () => ({
  useInsertMenuOpenAccessLog: vi.fn(),
}));

const mockedUseGetMenu = vi.mocked(useGetMenu);
const mockedUseInsertMenuOpenAccessLog = vi.mocked(useInsertMenuOpenAccessLog);

describe('useAdminMenuOpenAccessLog', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useAdminMenuStore.getState().clearCurrentMenu();

    mockedUseGetMenu.mockReset();
    mockedUseGetMenu.mockReturnValue({
      data: [
        {
          sysId: 'menu-1',
          menuCd: 'plantSearch',
          menuNm: '사업장 조회',
          parentMenuCd: 'ROOT',
          ordNo: '1',
          treeLevel: '1',
          menuUrl: '/admin/system/plant',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    mockedUseInsertMenuOpenAccessLog.mockReset();
    mockedUseInsertMenuOpenAccessLog.mockReturnValue({
      mutate: mutateMock,
    } as never);
  });

  it('syncs currentMenuCd from route and uses it for access log', async () => {
    mutateMock.mockImplementation((_variables, options) => {
      options.onSuccess();
    });

    const { result } = renderHook(() => useAdminMenuOpenAccessLog(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/admin/system/plant/new']}>{children}</MemoryRouter>
      ),
    });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(useAdminMenuStore.getState()).toMatchObject({
      currentMenuCd: 'plantSearch',
      currentPath: '/admin/system/plant/new',
    });
    expect(mutateMock).toHaveBeenCalledWith(
      { params: { menuCd: 'plantSearch' } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });
});
