import type { BrowserContext } from '@playwright/test';
import type { PaymentCompleteResponse, StatusRequest, StatusResponse } from '../../src/generated/types';

const orderId = '01M6N2PY8X87E9C3MVSA20MKVX';
const detailId = '01M6N2PY9X1MKCETDXVZXD11AJ';
const user = {
  userId: 'browser-staff', userName: '브라우저 직원', sysPlantCd: 'E2E',
  role: 'STAFF', staffRole: '02', initPwdRequired: false,
};
const payment: PaymentCompleteResponse = {
  header: { sysId: '01M6N2PJFPAD1V4171J4MVXP42', tableInfo: '5(테스트)', orderDatetime: '2026-11-10T12:00:00' },
  body: [{ detailSysId: detailId, linkSysId: orderId, rowType: 'MENU', itemName: '테스트 된장찌개', qty: 2, price: 16000, paymentYn: 'Y' }],
  footer: { sysId: '01M6N2PJFPAD1V4171J4MVXP42', totalPrice: 16000 },
};

// Browser regression only: fixtures follow generated DTOs and backend LoginResponse.
export async function installClientApi(
  context: BrowserContext,
  authenticated = false,
  options: { rejectSse?: boolean } = {},
) {
  const unexpectedRequests: string[] = [];
  const statusRequests: { path: string; body: StatusRequest }[] = [];
  const paymentRequests: unknown[] = [];
  const loginRequests: unknown[] = [];
  let loggedIn = authenticated;
  let statusFlag = '01';
  let paid = false;
  let sseAttempts = 0;
  let statusReads = 0;

  await context.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/auth/me') {
      await route.fulfill({ status: loggedIn ? 200 : 401, json: { success: loggedIn, data: loggedIn ? user : null } });
    } else if (method === 'POST' && path === '/api/auth/login') {
      loginRequests.push(request.postDataJSON());
      loggedIn = true;
      await route.fulfill({ json: { success: true, data: user } });
    } else if (method === 'GET' && path === '/api/system/settings/menu/search') {
      await route.fulfill({ json: [] });
    } else if (method === 'GET' && path === '/api/client/staff-call/notifications/unread') {
      await route.fulfill({ json: [] });
    } else if (method === 'GET' && path === '/api/client/store_manage/store_info/search') {
      await route.fulfill({ json: [{ sysId: 'store-e2e', storeName: '브라우저 테스트 매장' }] });
    } else if (method === 'GET' && path === '/api/sse/client/subscribe') {
      sseAttempts += 1;
      if (options.rejectSse) await route.abort('failed');
      else await route.fulfill({ contentType: 'text/event-stream', body: 'event: connect\ndata: connected\n\n' });
    } else if (method === 'GET' && path === '/api/client/order_manage/status/search') {
      statusReads += 1;
      const response: StatusResponse[] = paid ? [] : [{ statusFlag, statusList: [{
        orderNum: 9001,
        header: { sysId: orderId, tableNum: 5, orderDatetime: '2026-11-10T12:00:00', orderStatus: statusFlag },
        body: payment.body,
        footer: { sysId: orderId, totalPrice: 16000 },
      }] }];
      await route.fulfill({ json: response });
    } else if (method === 'GET' && path === '/api/client/order_manage/order-revision/catalog') {
      await route.fulfill({ json: { success: true, data: { categories: [] } } });
    } else if (method === 'POST' && ['/api/client/order_manage/status/go_to_cooking', '/api/client/order_manage/status/go_to_serving_complete'].includes(path)) {
      statusRequests.push({ path, body: request.postDataJSON() });
      statusFlag = path.endsWith('go_to_cooking') ? '02' : '03';
      await route.fulfill({ json: { success: true } });
    } else if (method === 'GET' && path === '/api/client/order_manage/status/get_payment_complete') {
      await route.fulfill({ json: payment });
    } else if (method === 'POST' && path === '/api/client/order_manage/status/payment_complete') {
      paymentRequests.push(request.postDataJSON());
      paid = true;
      await route.fulfill({ json: { success: true } });
    } else if (method === 'POST' && ['/api/log/log/menu_open_access_log', '/api/log/log/menu_close_access_log'].includes(path)) {
      await route.fulfill({ json: { success: true } });
    } else {
      unexpectedRequests.push(`${method} ${path}`);
      await route.fulfill({ status: 501, json: { success: false, message: 'Unconfigured browser fixture' } });
    }
  });
  return {
    unexpectedRequests, statusRequests, paymentRequests, loginRequests, orderId, payment,
    get sseAttempts() { return sseAttempts; },
    get statusReads() { return statusReads; },
    setOrderStatus(nextStatus: string) { statusFlag = nextStatus; },
  };
}
