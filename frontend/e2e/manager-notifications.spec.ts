import { expect, test } from '@playwright/test';
import { installManagerNotificationApi } from './fixtures/managerNotificationApi';

test('관리자 알림 읽음이 같은 브라우저의 다른 탭과 새로고침 후에도 유지된다', async ({ context, page }) => {
  const api = await installManagerNotificationApi(context);
  await page.goto('/client/main');
  await page.getByRole('button', { name: '읽지 않은 알림 2건', exact: true }).click();
  const panel = page.getByRole('dialog', { name: '알림', exact: true });
  await expect(panel.getByText('브라우저 공지', { exact: true })).toBeVisible();
  await expect(panel.getByText('브라우저 문의 답변', { exact: true })).toBeVisible();
  await expect(panel.getByText('답변 대기 문의', { exact: true })).toHaveCount(0);

  const otherTab = await context.newPage();
  await otherTab.goto('/client/main');
  await expect(otherTab.getByRole('button', { name: '읽지 않은 알림 2건', exact: true })).toBeVisible();
  await panel.getByRole('button', { name: '모두 읽음', exact: true }).click();
  await expect(page.getByRole('button', { name: '알림', exact: true })).toBeVisible();
  await expect(otherTab.getByRole('button', { name: '알림', exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: '알림', exact: true }).click();
  const restoredPanel = page.getByRole('dialog', { name: '알림', exact: true });
  // Wait for API content as well: a temporarily empty panel is not persistence proof.
  await expect(restoredPanel.getByText('브라우저 공지', { exact: true })).toBeVisible();
  await expect(restoredPanel.getByText('브라우저 문의 답변', { exact: true })).toBeVisible();
  await expect(restoredPanel.getByRole('button', { name: '모두 읽음', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^읽지 않은 알림/ })).toHaveCount(0);
  expect(api.unexpectedRequests).toEqual([]);
});
