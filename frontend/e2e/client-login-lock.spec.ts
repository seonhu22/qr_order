import { expect, test } from '@playwright/test';
import { installClientApi } from './fixtures/clientApi';

test('서버가 다섯 번째 실패 횟수를 반환하면 Client는 제한 안내 하나를 표시한다', async ({ context, page }) => {
  const api = await installClientApi(context);
  let attempts = 0;
  await context.route((url) => url.pathname === '/api/auth/login', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    attempts += 1;
    expect(route.request().postDataJSON()).toEqual({ userId: 'browser-staff', userPassword: 'Wrong-password!' });
    // Approved response contract; this does not test the server's DB counter.
    await route.fulfill({ status: 401, json: {
      success: false, data: attempts, message: '비밀번호가 맞지 않습니다.',
    } });
  });
  await page.goto('/client/login');
  await page.getByLabel('아이디', { exact: true }).fill('browser-staff');
  await page.getByLabel('비밀번호', { exact: true }).fill('Wrong-password!');
  const submit = page.getByRole('button', { name: '로그인', exact: true });
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = page.waitForResponse((item) => new URL(item.url()).pathname === '/api/auth/login');
    await submit.click();
    await response;
    await expect(page.getByText('비밀번호가 맞지 않습니다.', { exact: true })).toBeVisible();
    await expect(submit).toBeEnabled();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await submit.click();
  const notice = page.getByRole('dialog', { name: '로그인 제한 안내', exact: true });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  expect(attempts).toBe(5);
  await notice.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByLabel('비밀번호', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('아이디', { exact: true })).toHaveValue('browser-staff');
  await expect(page).toHaveURL(/\/client\/login$/);
  expect(api.unexpectedRequests).toEqual([]);
});
