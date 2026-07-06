import { describe, expect, it } from 'vitest';
import { mapToNoticeListRow } from './noticeApi';

describe('noticeApi', () => {
  it('maps notice writer name into registrant when backend provides insertUserNm', () => {
    expect(
      mapToNoticeListRow(
        {
          sysId: 'notice-1',
          noticeTitle: '클라이언트 공지',
          noticeDescription: '공지 내용',
          fileUlid: 'file-link-1',
          insertUserId: 'PC001',
          insertUserNm: '관리자',
          insertDatetime: '2026-06-29 10:00:00',
        },
        0,
      ),
    ).toEqual({
      id: 'notice-1',
      title: '클라이언트 공지',
      content: '공지 내용',
      registrant: '관리자',
      registeredAt: '2026-06-29 10:00',
      fileUlid: 'file-link-1',
    });
  });

  it('uses fallback values when optional response fields are missing', () => {
    expect(mapToNoticeListRow({}, 2)).toEqual({
      id: 'notice-2',
      title: '-',
      content: '-',
      registrant: '-',
      registeredAt: '-',
      fileUlid: undefined,
    });
  });
});
