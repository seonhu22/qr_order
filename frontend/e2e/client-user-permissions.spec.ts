import { expect, test } from '@playwright/test';
import { installClientApi } from './fixtures/clientApi';
import { installManagerNotificationApi } from './fixtures/managerNotificationApi';

test('스태프는 사용자 관리에 직접 접근하거나 URL 변형으로 우회할 수 없다', async ({ context, page }) => {
  const api = await installClientApi(context, true);
  for (const path of ['/client/store/user/management', '/CLIENT/STORE/USER/MANAGEMENT', '/client/store/%75ser/management']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/client\/main$/);
  }
  expect(api.unexpectedRequests).toEqual([]);
});

test('관리자 행은 읽기 전용이고 신규 권한은 스태프로 고정된다', async ({ context, page }) => {
  const api = await installManagerNotificationApi(context);
  const writes: string[] = [];
  await context.route((url) => url.pathname.startsWith('/api/client/store_manage/user_manage/') ||
    url.pathname === '/api/combo/common', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      writes.push(path);
      return route.fulfill({ status: 501, json: { success: false } });
    }
    await route.fulfill({ json: path === '/api/combo/common'
      ? [{ code: '01', name: '관리자' }, { code: '02', name: '스태프' }]
      : [
        { sysId: 'MANAGER', userId: 'manager-test', userNm: '관리자 테스트', userRole: '01', plantCd: 'E2E' },
        { sysId: 'STAFF', userId: 'staff-test', userNm: '직원 테스트', userRole: '02', plantCd: 'E2E' },
      ] });
  });
  await page.goto('/client/store/user/management');
  await expect(page.getByRole('region', { name: '유저 정보 관리', exact: true })).toBeVisible();
  await expect(page.getByText('관리자 테스트', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'manager-test 수정' })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'manager-test 선택' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'staff-test 수정' })).toBeVisible();
  await page.getByRole('button', { name: '신규', exact: true }).click();
  const role = page.getByRole('dialog', { name: '유저 등록' }).getByRole('combobox', { name: '권한', exact: true });
  await expect(role).toBeDisabled();
  await expect(role).toHaveText('스태프');
  expect(writes).toEqual([]);
  expect(api.unexpectedRequests).toEqual([]);
});
