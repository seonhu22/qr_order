import { expect, test } from '@playwright/test';
import { installClientApi } from './fixtures/clientApi';
import { installManagerNotificationApi } from './fixtures/managerNotificationApi';

test('URL 대소문자와 인코딩으로 메뉴 가드를 우회할 수 없다', async ({ context, page }) => {
  const api = await installClientApi(context, true);
  for (const path of ['/CLIENT/MENU/INFO/OPTION', '/client/%6denu/info/option']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/client\/main$/);
  }
  expect(api.unexpectedRequests).toEqual([]);
});

for (const [path, label] of [
  ['/client/menu/info/management', '메뉴 관리'],
  ['/client/menu/info/option', '옵션 관리'],
] as const) {
  test(`스태프의 ${label} 직접 진입은 메뉴 API 호출 전에 차단된다`, async ({ context, page }) => {
    const api = await installClientApi(context, true);
    await page.goto(path);
    await expect(page).toHaveURL(/\/client\/main$/);
    await expect(page.getByRole('heading', { name: '클라이언트 메인' })).toBeVisible();
    expect(api.unexpectedRequests).toEqual([]);
  });

  test(`관리자는 ${label} 페이지를 정상 조회한다`, async ({ context, page }) => {
    const api = await installManagerNotificationApi(context);
    const reads: string[] = [];
    await context.route((url) => [
      '/api/client/menu_manage/menu/master/search', '/api/client/menu_manage/menu/detail/search',
    ].includes(url.pathname), async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      reads.push(new URL(route.request().url()).pathname);
      await route.fulfill({ json: [] });
    });
    await page.goto(path);
    await expect(page.getByRole('region', { name: label, exact: true })).toBeVisible();
    await expect.poll(() => reads.length).toBeGreaterThan(0);
    expect(api.unexpectedRequests).toEqual([]);
  });
}
