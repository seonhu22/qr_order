import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mapToChangeHistoryRow, useChangeHistoryQuery } from './changeHistoryApi';

const { useGetAuditTrailMock } = vi.hoisted(() => ({
  useGetAuditTrailMock: vi.fn(),
}));

vi.mock('@/generated/settings-controller/settings-controller', () => ({
  useGetAuditTrail: (...args: unknown[]) => useGetAuditTrailMock(...args),
}));

describe('changeHistoryApi', () => {
  beforeEach(() => {
    useGetAuditTrailMock.mockReset();
  });

  it('maps audit trail dto into page row with safe fallback values', () => {
    expect(
      mapToChangeHistoryRow(
        {
          auditFlag: 'U',
          menuCd: 'commonCode',
          menuNm: '공통코드 관리',
          auditTrailContents: '사용여부 수정',
          insertDatetime: '2026-04-27T09:00:00.321Z',
        },
        0,
      ),
    ).toEqual({
      id: 'change-2026-04-27T09:00:00.321Z-U-공통코드 관리-0',
      auditFlag: 'U',
      menuNm: '공통코드 관리',
      auditTrailContents: '사용여부 수정',
      insertDatetime: '2026-04-27 09:00:00',
    });
  });

  it('uses empty strings when optional fields are missing', () => {
    expect(mapToChangeHistoryRow({}, 1)).toEqual({
      id: 'change----1',
      auditFlag: '',
      menuNm: '',
      auditTrailContents: '',
      insertDatetime: '',
    });
  });

  it('passes changeType to generated audit trail query params', () => {
    useGetAuditTrailMock.mockReturnValue({ data: [] });

    useChangeHistoryQuery({
      startDate: '2026-04-27 00:00:00',
      endDate: '2026-04-27 23:59:59',
      searchKeyword: '메뉴',
      auditFlag: 'U',
      changeType: '02',
    });

    expect(useGetAuditTrailMock).toHaveBeenCalledWith(
      {
        startDate: '2026-04-27 00:00:00',
        endDate: '2026-04-27 23:59:59',
        searchKeyword: '메뉴',
        changeType: '02',
      },
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: true,
        }),
      }),
    );
  });
});
