import { describe, expect, it } from 'vitest';
import { mapToAccessLogDetailRow, mapToAccessLogMasterRow } from './accessLogApi';

describe('accessLogApi', () => {
  it('maps access log master DTO into page row with safe fallback values', () => {
    expect(
      mapToAccessLogMasterRow({
        sysId: 'log-1',
        userId: 'PC001',
        userNm: '관리자',
        ipAddress: '127.0.0.1',
        loginDatetime: '2026-04-25T09:00:00',
        logoutDatetime: '2026-04-25T18:00:00.123Z',
      }),
    ).toEqual({
      id: 'log-1',
      sysId: 'log-1',
      userId: 'PC001',
      userNm: '관리자',
      ipAddress: '127.0.0.1',
      loginDatetime: '2026-04-25 09:00:00',
      logoutDatetime: '2026-04-25 18:00:00',
    });
  });

  it('uses empty strings when optional master fields are missing', () => {
    expect(mapToAccessLogMasterRow({})).toEqual({
      id: '',
      sysId: '',
      userId: '',
      userNm: '',
      ipAddress: '',
      loginDatetime: '',
      logoutDatetime: '',
    });
  });

  it('maps access log detail DTO and falls back menu name to menu code', () => {
    expect(
      mapToAccessLogDetailRow(
        {
          menuCd: 'commonCode',
          menuOpenDatetime: '2026-04-25T09:01:00',
          menuCloseDatetime: '2026-04-25T09:05:00.456Z',
        },
        0,
      ),
    ).toEqual({
      id: 'detail-0-commonCode-2026-04-25T09:01:00',
      menuCd: 'commonCode',
      menuNm: 'commonCode',
      menuOpenDatetime: '2026-04-25 09:01:00',
      menuCloseDatetime: '2026-04-25 09:05:00',
    });
  });
});
