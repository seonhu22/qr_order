import { expect, test } from '@playwright/test';
import { installClientApi } from './fixtures/clientApi';

// Backend filtering is separately tested against PostgreSQL. Here responses model that contract.
for (const role of ['01', '02']) {
  test(`${role} 역할은 전체와 자기 대상 공지를 보고 스태프는 문의를 조회하지 않는다`, async ({ context, page }) => {
    const api = await installClientApi(context, true);
    let qnaCalls = 0;
    await context.route((url) => ['/api/auth/me', '/api/client/board/notice/search', '/api/client/board/qna/search'].includes(url.pathname), async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/me') return route.fulfill({ json: { success: true, data: {
        userId: `notice-${role}`, userName: '대상 테스트', sysPlantCd: 'E2E', role: 'STAFF', staffRole: role, initPwdRequired: false,
      } } });
      if (path.endsWith('/qna/search')) {
        qnaCalls += 1;
        return route.fulfill({ json: [] });
      }
      return route.fulfill({ json: [
        { sysId: 'all', noticeTitle: '전체 공지', openDate: '2026-11-18' },
        { sysId: 'targeted', noticeTitle: role === '01' ? '관리자 공지' : '스태프 공지', openDate: '2026-11-18' },
      ] });
    });
    await page.goto('/client/main');
    await page.getByRole('button', { name: '읽지 않은 알림 2건', exact: true }).click();
    const panel = page.getByRole('dialog', { name: '알림', exact: true });
    await expect(panel.getByText('전체 공지', { exact: true })).toBeVisible();
    await expect(panel.getByText(role === '01' ? '관리자 공지' : '스태프 공지', { exact: true })).toBeVisible();
    await expect(panel.getByText(role === '01' ? '스태프 공지' : '관리자 공지', { exact: true })).toHaveCount(0);
    await panel.getByRole('button', { name: '모두 읽음', exact: true }).click();
    await expect(page.getByRole('button', { name: '알림', exact: true })).toBeVisible();
    if (role === '01') expect(qnaCalls).toBeGreaterThan(0);
    else expect(qnaCalls).toBe(0);
    expect(api.unexpectedRequests).toEqual([]);
  });
}
