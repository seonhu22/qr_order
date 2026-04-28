import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChangeHistoryPageState } from './useChangeHistoryPageState';

const useChangeHistoryQueryMock = vi.fn();
const mapToChangeHistoryRowMock = vi.fn();

vi.mock('../api/changeHistoryApi', () => ({
  useChangeHistoryQuery: (...args: unknown[]) => useChangeHistoryQueryMock(...args),
  mapToChangeHistoryRow: (...args: unknown[]) => mapToChangeHistoryRowMock(...args),
}));

describe('useChangeHistoryPageState', () => {
  beforeEach(() => {
    useChangeHistoryQueryMock.mockReset();
    mapToChangeHistoryRowMock.mockReset();

    useChangeHistoryQueryMock.mockReturnValue({
      data: [
        { auditFlag: 'I', menuNm: '공통코드', auditTrailContents: '등록', insertDatetime: '2026-04-27T09:00:00' },
        { auditFlag: 'U', menuNm: '규칙관리', auditTrailContents: '수정', insertDatetime: '2026-04-27T10:00:00' },
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
  });

  it('returns all rows by default and filters rows by audit flag', () => {
    const { result } = renderHook(() => useChangeHistoryPageState());

    expect(result.current.data.rows).toHaveLength(2);

    act(() => {
      result.current.actions.handleAuditFlagChange('U');
    });

    expect(result.current.data.rows).toEqual([
      {
        id: 'change-1',
        auditFlag: 'U',
        menuNm: '규칙관리',
        auditTrailContents: '수정',
        insertDatetime: '2026-04-27T10:00:00',
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
