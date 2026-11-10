import type { BrowserContext } from '@playwright/test';
import type { ClientNoticeResponse, ClientQnaResponse } from '../../src/generated/types';
import { installClientApi } from './clientApi';

// Independent DTO fixtures: unanswered inquiries must not create notifications.
const notices: ClientNoticeResponse[] = [{
  sysId: 'browser-notice', noticeTitle: '브라우저 공지',
  noticeDescription: '공지 본문', openDate: '2026-11-10 10:00:00',
}];
const inquiries: ClientQnaResponse[] = [{
  sysId: 'browser-answer', qnaTitle: '브라우저 문의 답변',
  answerYn: 'Y', answerDatetime: '2026-11-10 11:00:00', answerDescription: '답변 본문',
}, {
  sysId: 'browser-pending', qnaTitle: '답변 대기 문의', answerYn: 'N',
}];

export async function installManagerNotificationApi(context: BrowserContext) {
  // Shared fixture handles layout requests and fails every unknown API with 501.
  const api = await installClientApi(context, true);
  await context.route((url) => [
    '/api/auth/me', '/api/client/board/notice/search', '/api/client/board/qna/search',
  ].includes(url.pathname), async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') {
      await route.fulfill({ json: { success: true, data: {
        userId: 'browser-manager', userName: '브라우저 관리자', sysPlantCd: 'E2E',
        role: 'STAFF', staffRole: '01', initPwdRequired: false,
      } } });
    } else {
      await route.fulfill({ json: path.endsWith('/notice/search') ? notices : inquiries });
    }
  });
  return api;
}
