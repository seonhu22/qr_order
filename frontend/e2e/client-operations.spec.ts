import { expect, test } from '@playwright/test';
import { installClientApi } from './fixtures/clientApi';

test('Client 로그인 후 보호된 주문현황 페이지에 진입한다', async ({ context, page }) => {
  const api = await installClientApi(context);
  await page.goto('/client/order/status/management');
  await expect(page.getByRole('heading', { name: '로그인', exact: true })).toBeVisible();
  await page.getByLabel('아이디', { exact: true }).fill('browser-staff');
  await page.getByLabel('비밀번호', { exact: true }).fill('Browser-test-123!');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/client\/main$/);
  await expect(page.getByRole('heading', { name: '클라이언트 메인' })).toBeVisible();
  await page.goto('/client/order/status/management');
  await expect(page.getByRole('region', { name: '주문 상태 관리' })).toBeVisible();
  await expect(page.getByRole('button', { name: '조리시작', exact: true })).toBeVisible();
  expect(api.loginRequests).toEqual([{ userId: 'browser-staff', userPassword: 'Browser-test-123!' }]);
  expect(api.unexpectedRequests).toEqual([]);
});

test('접수 주문을 조리/서빙 후 영수증의 카드 결제를 전송한다', async ({ context, page }) => {
  const api = await installClientApi(context, true);
  await page.goto('/client/order/status/management');
  await page.getByRole('button', { name: '조리시작', exact: true }).click();
  await page.getByRole('button', { name: '서빙완료', exact: true }).click();
  await page.getByRole('button', { name: '결제처리', exact: true }).click();
  await page.getByRole('button', { name: '결제완료', exact: true }).click();
  const receipt = page.getByRole('dialog', { name: '결제 완료 처리' });
  await expect(receipt).toBeVisible();
  await expect(receipt.getByText('테스트 된장찌개', { exact: true })).toBeVisible();
  await receipt.getByText('카드', { exact: true }).click();
  await expect(receipt.getByRole('radio', { name: '카드', exact: true })).toBeChecked();
  await receipt.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('결제완료 되었습니다.', { exact: true })).toBeVisible();
  expect(api.statusRequests.map(({ body }) => body)).toEqual([
    { orderNum: 9001, header: { sysId: api.orderId, tableNum: 5, orderDatetime: '2026-11-10 12:00:00' } },
    { orderNum: 9001, header: { sysId: api.orderId, tableNum: 5, orderDatetime: '2026-11-10 12:00:00' } },
  ]);
  expect(api.paymentRequests).toEqual([{ paymentType: '카드', ...api.payment }]);
  await expect(page.getByRole('button', { name: '결제처리', exact: true })).toHaveCount(0);
  expect(api.unexpectedRequests).toEqual([]);
});
