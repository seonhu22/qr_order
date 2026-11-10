import { expect, test } from '@playwright/test';
import { installOrderRevisionConflictApi, revisionConflictMessage } from './fixtures/orderRevisionApi';

test('오프라인 수정 저장은 요청 없이 초안을 유지하고 온라인 재시도 충돌을 안내한다', async ({ context, page }) => {
  const api = await installOrderRevisionConflictApi(context);
  await page.goto('/client/order/status/management');
  await page.getByRole('button', { name: '수정', exact: true }).click();
  const editor = page.getByRole('dialog', { name: '주문 수정', exact: true });
  await editor.getByRole('button', { name: '취소', exact: true }).click();
  await expect(editor.getByText('남아있는 메뉴가 없습니다.', { exact: false })).toBeVisible();
  await editor.getByRole('button', { name: '확인', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: '알림', exact: true });
  await expect(confirmation.getByText('주문수정 하시겠습니까?', { exact: true })).toBeVisible();

  await context.setOffline(true);
  await confirmation.getByRole('button', { name: '확인', exact: true }).click();
  await expect(confirmation.getByText('네트워크 연결을 확인한 후 다시 시도해주세요.', { exact: true })).toBeVisible();
  await expect(confirmation.getByRole('button', { name: '확인', exact: true })).toBeEnabled();
  expect(api.revisionRequests).toEqual([]);

  await context.setOffline(false);
  await confirmation.getByRole('button', { name: '확인', exact: true }).click();
  await expect(confirmation.getByText(revisionConflictMessage, { exact: true })).toBeVisible();
  expect(api.revisionRequests).toHaveLength(1);
  expect(api.revisionRequests[0]).toEqual({
    clientRequestId: expect.stringMatching(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i),
    orderGroupIds: [api.orderId],
    removeDetailIds: [api.payment.body![0]!.detailSysId],
    addedItems: [],
  });
  await confirmation.getByRole('button', { name: '닫기', exact: true }).click();
  // A server conflict must preserve the draft, not silently replace it with GET data.
  await expect(editor).toBeVisible();
  await expect(editor.getByText('남아있는 메뉴가 없습니다.', { exact: false })).toBeVisible();
  await expect(editor.getByText('테스트 된장찌개', { exact: false })).toHaveCount(0);
  expect(api.unexpectedRequests).toEqual([]);
});
