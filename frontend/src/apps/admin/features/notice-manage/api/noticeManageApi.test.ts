import { describe, expect, it } from 'vitest';
import { mapToNoticeManageRow } from './noticeManageApi';

describe('noticeManageApi', () => {
  it('maps notice response metadata into page row when backend provides extra fields', () => {
    expect(
      mapToNoticeManageRow(
        {
          sysId: 'notice-1',
          noticeTitle: '점검 공지',
          noticeDescription: '시스템 점검 안내',
          startDate: '2026-04-29',
          insertUserId: 'PC001',
          insertDatetime: '2026-04-29 10:00:00',
          modifyDatetime: '2026-04-29 11:00:00',
        },
        0,
      ),
    ).toEqual({
      id: 'notice-1',
      sysId: 'notice-1',
      noticeType: 'notice',
      target: 'all',
      title: '점검 공지',
      content: '시스템 점검 안내',
      registrant: 'PC001',
      registeredAt: '2026-04-29 10:00:00',
      updatedAt: '2026-04-29 11:00:00',
    });
  });

  it('falls back to synthetic row id when sysId is missing from response', () => {
    expect(
      mapToNoticeManageRow(
        {
          noticeTitle: '점검 공지',
          noticeDescription: '시스템 점검 안내',
          startDate: '2026-04-29',
        },
        2,
      ),
    ).toEqual({
      id: 'notice-2-점검 공지-2026-04-29',
      sysId: '',
      noticeType: 'notice',
      target: 'all',
      title: '점검 공지',
      content: '시스템 점검 안내',
      registrant: '',
      registeredAt: '2026-04-29',
      updatedAt: '',
    });
  });
});
