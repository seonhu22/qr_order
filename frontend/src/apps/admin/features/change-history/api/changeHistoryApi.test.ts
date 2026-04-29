import { describe, expect, it } from 'vitest';
import { mapToChangeHistoryRow } from './changeHistoryApi';

describe('changeHistoryApi', () => {
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
      id: 'change-2026-04-27T09:00:00.321Z-U-공통코드 관리',
      auditFlag: 'U',
      menuNm: '공통코드 관리',
      auditTrailContents: '사용여부 수정',
      insertDatetime: '2026-04-27 09:00:00',
    });
  });

  it('uses empty strings when optional fields are missing', () => {
    expect(mapToChangeHistoryRow({}, 1)).toEqual({
      id: 'change---1',
      auditFlag: '',
      menuNm: '',
      auditTrailContents: '',
      insertDatetime: '',
    });
  });
});
