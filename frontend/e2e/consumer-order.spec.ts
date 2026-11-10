import { expect, test, type Page } from '@playwright/test';
import { consumerMenuId, consumerMenuName, installConsumerApi } from './fixtures/consumerApi';

async function addMenuAndSubmit(page: Page) {
  await page.goto('/consumer/order');
  await page.getByRole('button', { name: new RegExp(consumerMenuName) }).click();
  await page.getByRole('dialog').getByRole('button', { name: /장바구니에 담기/ }).click();
  await page.getByRole('button', { name: /개 담음/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: '주문하기', exact: true }).click();
  await page.getByRole('alertdialog', { name: '주문하시겠습니까?' })
    .getByRole('button', { name: '주문하기', exact: true }).click();
}

async function persistedCart(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('qr-order:consumer-cart');
    return raw ? JSON.parse(raw).state : null;
  });
}

test('Consumer 주문 성공 후 장바구니와 요청 식별자를 초기화한다', async ({ page, context }) => {
  const api = await installConsumerApi(context);
  await addMenuAndSubmit(page);
  await expect(page.getByText('주문 완료', { exact: true })).toBeVisible();
  expect(api.orderRequests).toHaveLength(1);
  expect(api.orderRequests[0]).toMatchObject({
    items: [{ menuSysId: consumerMenuId, quantity: 1, options: [] }],
    clientRequestId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  });
  await expect.poll(() => persistedCart(page)).toMatchObject({ cart: [], clientRequestId: null });
  await expect(page.getByRole('button', { name: /개 담음/ })).toHaveCount(0);
  expect(api.unexpectedRequests).toEqual([]);
});

test('Consumer 주문 일시 실패 후 장바구니와 같은 요청 식별자로 재시도한다', async ({ page, context }) => {
  const api = await installConsumerApi(context, true);
  await addMenuAndSubmit(page);
  await expect(page.getByText('주문 연결이 원활하지 않습니다.', { exact: true })).toBeVisible();
  expect(api.orderRequests).toHaveLength(1);
  const cart = await persistedCart(page);
  expect(cart.cart).toHaveLength(1);
  expect(cart.clientRequestId).toBe(api.orderRequests[0].clientRequestId);
  await page.getByRole('button', { name: '다시 시도하기', exact: true }).click();
  await expect(page.getByText('주문 완료', { exact: true })).toBeVisible();
  expect(api.orderRequests).toHaveLength(2);
  expect(api.orderRequests[1]).toEqual(api.orderRequests[0]);
  await expect.poll(() => persistedCart(page)).toMatchObject({ cart: [], clientRequestId: null });
  expect(api.unexpectedRequests).toEqual([]);
});
