import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccessLogPageState } from './useAccessLogPageState';

const useAccessLogMasterQueryMock = vi.fn();
const useAccessLogDetailQueryMock = vi.fn();
const mapToAccessLogMasterRowMock = vi.fn();
const mapToAccessLogDetailRowMock = vi.fn();
const useAdminMenuCatalogQueryMock = vi.fn();
const masterRefetchMock = vi.fn();

vi.mock('../api/accessLogApi', () => ({
  useAccessLogMasterQuery: (...args: unknown[]) => useAccessLogMasterQueryMock(...args),
  useAccessLogDetailQuery: (...args: unknown[]) => useAccessLogDetailQueryMock(...args),
  mapToAccessLogMasterRow: (...args: unknown[]) => mapToAccessLogMasterRowMock(...args),
  mapToAccessLogDetailRow: (...args: unknown[]) => mapToAccessLogDetailRowMock(...args),
}));

vi.mock('@/shared/menu/useAdminMenuCatalogQuery', () => ({
  useAdminMenuCatalogQuery: (...args: unknown[]) => useAdminMenuCatalogQueryMock(...args),
}));

describe('useAccessLogPageState', () => {
  beforeEach(() => {
    useAccessLogMasterQueryMock.mockReset();
    useAccessLogDetailQueryMock.mockReset();
    mapToAccessLogMasterRowMock.mockReset();
    mapToAccessLogDetailRowMock.mockReset();
    useAdminMenuCatalogQueryMock.mockReset();
    masterRefetchMock.mockReset();

    useAccessLogMasterQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: masterRefetchMock,
    });

    useAccessLogDetailQueryMock.mockReturnValue({
      data: [{ menuCd: 'commonCode' }],
      isLoading: false,
      isError: false,
    });

    mapToAccessLogMasterRowMock.mockImplementation((item: Record<string, unknown>) => item);
    mapToAccessLogDetailRowMock.mockImplementation(() => ({
      id: 'detail-1',
      menuCd: 'commonCode',
      menuNm: 'commonCode',
      menuOpenDatetime: '',
      menuCloseDatetime: '',
    }));

    useAdminMenuCatalogQueryMock.mockReturnValue({
      catalog: {
        items: [],
        byMenuCd: new Map([
          [
            'commonCode',
            {
              menuCd: 'commonCode',
              menuNm: '공통코드 관리',
              parentMenuCd: 'ROOT',
              path: '/admin/system/common-code',
              ordNo: 1,
              treeLevel: 1,
            },
          ],
        ]),
        byPath: new Map(),
      },
    });
  });

  it('fills access log detail menu name from the shared menu catalog', () => {
    const { result } = renderHook(() => useAccessLogPageState());

    expect(result.current.data.detailRows).toEqual([
      {
        id: 'detail-1',
        menuCd: 'commonCode',
        menuNm: '공통코드 관리',
        menuOpenDatetime: '',
        menuCloseDatetime: '',
      },
    ]);
  });

  it('refetches when searching again with the same conditions', () => {
    const { result } = renderHook(() => useAccessLogPageState());

    act(() => {
      result.current.actions.handleSearch();
    });

    expect(masterRefetchMock).toHaveBeenCalledTimes(1);
  });
});
