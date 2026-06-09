import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChangeHistoryPageState } from './useChangeHistoryPageState';

const useChangeHistoryQueryMock = vi.fn();
const mapToChangeHistoryRowMock = vi.fn();
const useAdminMenuCatalogQueryMock = vi.fn();

vi.mock('../api/changeHistoryApi', () => ({
  useChangeHistoryQuery: (...args: unknown[]) => useChangeHistoryQueryMock(...args),
  mapToChangeHistoryRow: (...args: unknown[]) => mapToChangeHistoryRowMock(...args),
}));

vi.mock('@/shared/menu/useAdminMenuCatalogQuery', () => ({
  useAdminMenuCatalogQuery: (...args: unknown[]) => useAdminMenuCatalogQueryMock(...args),
}));

describe('useChangeHistoryPageState', () => {
  beforeEach(() => {
    useChangeHistoryQueryMock.mockReset();
    mapToChangeHistoryRowMock.mockReset();
    useAdminMenuCatalogQueryMock.mockReset();

    useChangeHistoryQueryMock.mockReturnValue({
      data: [
        { auditFlag: 'I', menuCd: 'commonCode', menuNm: '', auditTrailContents: '등록', insertDatetime: '2026-04-27T09:00:00' },
        { auditFlag: 'U', menuNm: '규칙관리', auditTrailContents: '수정', insertDatetime: '2026-04-27T10:00:00' },
        { auditFlag: 'FI', menuNm: '공지사항 관리', auditTrailContents: '파일 등록', insertDatetime: '2026-04-27T11:00:00' },
      ],
      isLoading: false,
      isError: false,
    });

    mapToChangeHistoryRowMock.mockImplementation((item: { auditFlag?: string; menuNm?: string; auditTrailContents?: string; insertDatetime?: string }, index: number) => ({
      id: `change-${index}`,
      auditFlag: item.auditFlag ?? '',
      menuNm: item.menuNm ?? '',
      auditTrailContents: item.auditTrailContents ?? '',
      insertDatetime: item.insertDatetime ?? '',
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

  it('returns all rows by default and fills missing menu name from catalog', () => {
    const { result } = renderHook(() => useChangeHistoryPageState());

    expect(useChangeHistoryQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        auditFlag: 'ALL',
        changeType: '',
      }),
    );

    expect(result.current.data.rows).toEqual([
      {
        id: 'change-0',
        auditFlag: 'I',
        menuNm: '공통코드 관리',
        auditTrailContents: '등록',
        insertDatetime: '2026-04-27T09:00:00',
      },
      {
        id: 'change-1',
        auditFlag: 'U',
        menuNm: '규칙관리',
        auditTrailContents: '수정',
        insertDatetime: '2026-04-27T10:00:00',
      },
      {
        id: 'change-2',
        auditFlag: 'FI',
        menuNm: '공지사항 관리',
        auditTrailContents: '파일 등록',
        insertDatetime: '2026-04-27T11:00:00',
      },
    ]);
  });

  it('passes supported audit flags as backend changeType params on search', () => {
    const { result } = renderHook(() => useChangeHistoryPageState());

    act(() => {
      result.current.actions.handleAuditFlagChange('U');
    });

    act(() => {
      result.current.actions.handleSearch();
    });

    expect(useChangeHistoryQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        auditFlag: 'U',
        changeType: '02',
      }),
    );
    expect(result.current.data.rows).toEqual([
      {
        id: 'change-0',
        auditFlag: 'I',
        menuNm: '공통코드 관리',
        auditTrailContents: '등록',
        insertDatetime: '2026-04-27T09:00:00',
      },
      {
        id: 'change-1',
        auditFlag: 'U',
        menuNm: '규칙관리',
        auditTrailContents: '수정',
        insertDatetime: '2026-04-27T10:00:00',
      },
      {
        id: 'change-2',
        auditFlag: 'FI',
        menuNm: '공지사항 관리',
        auditTrailContents: '파일 등록',
        insertDatetime: '2026-04-27T11:00:00',
      },
    ]);
  });

  it.each([
    ['I', '01'],
    ['U', '02'],
    ['D', '03'],
  ])('maps audit flag %s to changeType %s', (auditFlag, changeType) => {
    const { result } = renderHook(() => useChangeHistoryPageState());

    act(() => {
      result.current.actions.handleAuditFlagChange(auditFlag);
    });

    act(() => {
      result.current.actions.handleSearch();
    });

    expect(useChangeHistoryQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        auditFlag,
        changeType,
      }),
    );
  });

  it('keeps client-side filtering for file audit flags without backend changeType', () => {
    const { result } = renderHook(() => useChangeHistoryPageState());

    act(() => {
      result.current.actions.handleAuditFlagChange('FI');
    });

    act(() => {
      result.current.actions.handleSearch();
    });

    expect(useChangeHistoryQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        auditFlag: 'FI',
        changeType: '',
      }),
    );
    expect(result.current.data.rows).toEqual([
      {
        id: 'change-2',
        auditFlag: 'FI',
        menuNm: '공지사항 관리',
        auditTrailContents: '파일 등록',
        insertDatetime: '2026-04-27T11:00:00',
      },
    ]);
  });

  it('sets a validation error when the end date is earlier than the start date', () => {
    const { result } = renderHook(() => useChangeHistoryPageState());

    act(() => {
      result.current.actions.handleStartDateChange('2026-04-27T12:00');
    });

    act(() => {
      result.current.actions.handleEndDateChange('2026-04-26T12:00');
    });

    expect(result.current.uiProps.dateRangeError).toBe(
      '종료일시는 시작일시보다 이후여야 합니다.',
    );
  });
});
