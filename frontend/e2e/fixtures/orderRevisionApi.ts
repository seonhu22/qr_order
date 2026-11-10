import type { BrowserContext } from '@playwright/test';
import type { OrderRevisionRequest } from '../../src/generated/types';
import { installClientApi } from './clientApi';

export const revisionConflictMessage = '접수 또는 조리 중인 주문만 수정할 수 있습니다.';

export async function installOrderRevisionConflictApi(context: BrowserContext) {
  const api = await installClientApi(context, true);
  const revisionRequests: OrderRevisionRequest[] = [];
  await context.route((url) => url.pathname === '/api/client/order_manage/status/revise_order', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    revisionRequests.push(route.request().postDataJSON() as OrderRevisionRequest);
    await route.fulfill({ status: 409, json: {
      success: false, data: null, error: 'ORDER_REVISION_STATUS_CONFLICT', message: revisionConflictMessage,
    } });
  });
  return { ...api, revisionRequests };
}
