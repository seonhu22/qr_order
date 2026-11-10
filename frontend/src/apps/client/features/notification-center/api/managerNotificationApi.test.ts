import { describe, expect, it } from 'vitest';
import { mapManagerNotifications } from './managerNotificationApi';

describe('mapManagerNotifications', () => {
  it('공지와 답변 완료 문의만 식별자와 시각으로 정렬하고 종류별 ID 충돌을 막는다', () => {
    const result = mapManagerNotifications([
      { sysId: 'same', noticeTitle: '공지', openDate: '2026-11-10 10:00:00' },
      { noticeTitle: '식별자 없음' },
    ], [
      { sysId: 'same', qnaTitle: '답변', answerYn: 'Y', answerDatetime: '2026-11-10 11:00:00' },
      { sysId: 'pending', answerYn: 'N' },
    ]);
    expect(result.map((item) => item.kind)).toEqual(['qna', 'notice']);
    expect(result[0].sysId).toBe('same');
    expect(result[0].targetPath).toBe('/client/board/inquiry/management');
  });
});
