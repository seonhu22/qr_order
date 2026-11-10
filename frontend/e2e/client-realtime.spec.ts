import { expect, test } from '@playwright/test';
import { installClientApi } from './fixtures/clientApi';

test('SSE 반복 연결 실패 후 주문현황 polling으로 외부 상태 변경을 반영한다', async ({ context, page }) => {
  const api = await installClientApi(context, true, { rejectSse: true });
  await page.clock.install();
  await page.goto('/client/order/status/management');
  await expect(page.getByRole('button', { name: '조리시작', exact: true })).toBeVisible();
  await expect.poll(() => api.sseAttempts).toBeGreaterThanOrEqual(1);
  await page.clock.pauseAt(new Date(Date.now() + 1_000));

  // Production reconnect delays include random jitter (up to 2s). Advance in
  // bounded steps without replacing EventSource, stores or the production hook.
  for (let attempt = 2; attempt <= 5; attempt += 1) {
    await page.clock.runFor(62_000);
    await expect.poll(() => api.sseAttempts).toBeGreaterThanOrEqual(attempt);
  }
  const readsBeforeChange = api.statusReads;
  api.setOrderStatus('02');
  await page.clock.runFor(31_000);
  await expect.poll(() => api.statusReads).toBeGreaterThan(readsBeforeChange);
  // Network completion schedules React Query notifications on browser timers.
  // Resume the clock before asserting rendered state, not only request count.
  await page.clock.resume();
  await expect(page.getByRole('button', { name: '서빙완료', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '조리시작', exact: true })).toHaveCount(0);
  // No button mutation or SSE event produced this change: only a new GET can.
  expect(api.statusRequests).toEqual([]);
  expect(api.unexpectedRequests).toEqual([]);
});
