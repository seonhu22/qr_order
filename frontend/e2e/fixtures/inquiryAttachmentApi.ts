import type { BrowserContext } from '@playwright/test';
import type { QnaResponse } from '../../src/generated/types';

type CapturedPart = string | { name: string; type: string; content: string };
const inquiry: QnaResponse = {
  sysId: 'browser-qna', fileUlid: 'browser-original-files', qnaTitle: '결제 문의',
  qnaDescription: '결제 확인 부탁드립니다.', answerYn: 'N', answerDescription: '',
};

export async function installInquiryAttachmentApi(context: BrowserContext) {
  const unexpectedRequests: string[] = [];
  const savedForms: Record<string, CapturedPart>[] = [];
  let saved = false;
  await context.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/auth/me') {
      await route.fulfill({ json: { success: true, data: {
        userId: 'browser-admin', userName: '브라우저 관리자', role: 'ADMIN', initPwdRequired: false,
      } } });
    } else if (method === 'GET' && path === '/api/system/settings/menu/search') {
      await route.fulfill({ json: [] });
    } else if (method === 'GET' && path === '/api/system/settings/board/qna/search') {
      await route.fulfill({ json: [{ ...inquiry, answerYn: saved ? 'Y' : 'N' }] });
    } else if (method === 'GET' && path === '/api/attach_file') {
      await route.fulfill({ json: [] });
    } else if (method === 'POST' && path === '/api/system/settings/board/qna/update') {
      // Parse browser-encoded multipart bytes, not a production FormData builder.
      const form = await new Response(new Uint8Array(request.postDataBuffer()!), {
        headers: { 'content-type': request.headers()['content-type'] },
      }).formData();
      const captured: Record<string, CapturedPart> = {};
      for (const [key, value] of form.entries()) {
        captured[key] = typeof value === 'string' ? value : {
          name: value.name, type: value.type, content: await value.text(),
        };
      }
      savedForms.push(captured);
      saved = savedForms.length > 1;
      await route.fulfill({ status: saved ? 200 : 500,
        json: { success: saved, message: saved ? '저장되었습니다.' : '저장 실패' } });
    } else if (method === 'POST' && ['/api/log/log/menu_open_access_log', '/api/log/log/menu_close_access_log'].includes(path)) {
      await route.fulfill({ json: { success: true } });
    } else {
      unexpectedRequests.push(`${method} ${path}`);
      await route.fulfill({ status: 501, json: { success: false, message: 'Unconfigured browser fixture' } });
    }
  });
  return { unexpectedRequests, savedForms };
}
