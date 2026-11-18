import { getNotice1, getQna1 } from '@/generated/board-controller/board-controller';
import type { ClientNoticeResponse, ClientQnaResponse } from '@/generated/types';
import type { ClientNotificationItem } from '../types';

export function mapManagerNotifications(notices: ClientNoticeResponse[], inquiries: ClientQnaResponse[]): ClientNotificationItem[] {
  const items: ClientNotificationItem[] = [];
  for (const notice of notices) {
    if (!notice.sysId || !notice.openDate) continue;
    items.push({ kind: 'notice', sysId: notice.sysId, title: notice.noticeTitle ?? '공지사항',
      body: notice.noticeDescription ?? '', timestamp: notice.openDate, seen: false,
      targetPath: '/client/board/notice/list' });
  }
  for (const inquiry of inquiries) {
    if (inquiry.answerYn !== 'Y' || !inquiry.sysId || !inquiry.answerDatetime) continue;
    items.push({ kind: 'qna', sysId: inquiry.sysId, title: inquiry.qnaTitle ?? '문의 답변',
      body: inquiry.answerDescription ?? '', timestamp: inquiry.answerDatetime, seen: false,
      targetPath: '/client/board/inquiry/management' });
  }
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp) || a.kind.localeCompare(b.kind) || a.sysId.localeCompare(b.sysId));
}

export async function fetchManagerNotifications(signal?: AbortSignal, includeInquiries = true) {
  const [notices, inquiries] = await Promise.all([
    getNotice1({}, signal),
    includeInquiries ? getQna1({}, signal) : Promise.resolve([]),
  ]);
  return mapManagerNotifications(notices, inquiries);
}
