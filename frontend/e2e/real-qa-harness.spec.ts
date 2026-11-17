import { test, expect, type Browser } from '@playwright/test';
import { installConsumerApi, consumerMenuName } from './fixtures/consumerApi';
import { installClientApi } from './fixtures/clientApi';
import { runOrderPayment } from '../e2e-real/order-payment';
import { readFileSync } from 'node:fs';

// These prove the runner/UI flow only. They do not prove real backend persistence.
async function setup(browser: Browser, mode: 'success' | 'occupied' | 'foreign-payment' | 'delayed-qr' | 'wrong-scope' | 'short-number' | 'resume' = 'success') {
  const manager = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block' });
  const consumer = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block' });
  const consumerApi = await installConsumerApi(consumer, false, mode === 'short-number' ? '1' : '9001');
  const clientApi = await installClientApi(manager, true, { orderNum: mode === 'short-number' ? 1 : 9001 });
  clientApi.payment.body![0].itemName = consumerMenuName;
  clientApi.payment.body![0].qty = 1;
  clientApi.payment.body![0].price = 8000;
  clientApi.payment.footer!.totalPrice = 8000;
  const flow = { qrPath: '/qr/runner-test', tableSysId: 'table-browser-e2e', tableNum: 5, menuName: consumerMenuName };
  let qrReady = mode !== 'delayed-qr';
  await consumer.route('**/api/qr/runner-test', async (route) => {
    // Model an asynchronous QR authentication response, not an arbitrary runner wait.
    if (!qrReady) await new Promise((resolve) => setTimeout(resolve, 1500));
    qrReady = true;
    await route.fulfill({ json: { success: true, data: {
    sysId: flow.tableSysId, sysPlantCd: 'E2E', tableNum: 5, tableName: 'QA', tableQty: 4,
  } } });
  });
  await consumer.route('**/api/client/consumer/session', (route) => {
    if (!qrReady) return route.fulfill({ status: 401, json: { success: false, data: null } });
    return route.fulfill({ json: { success: true, data: {
    consumerSessionId: 'visit-runner', status: clientApi.paymentRequests.length ? 'CLOSED' : 'ACTIVE',
    sysPlantCd: mode === 'wrong-scope' ? 'OTHER' : 'E2E', tableSysId: mode === 'wrong-scope' ? 'OTHER-TABLE' : flow.tableSysId, tableName: 'QA', tableNum: 5, tableQty: 4,
    storeName: 'QA', orderingAllowed: true, startedAt: '2026-11-17 00:00:00',
  } } });
  });
  await manager.route('**/api/client/order_manage/status/search', (route) => {
    if (!consumerApi.orderRequests.length && mode !== 'occupied' && mode !== 'resume') return route.fulfill({ json: [] });
    return route.fallback();
  });
  if (mode === 'foreign-payment') {
    await manager.route('**/api/client/order_manage/status/get_payment_complete?*', (route) => route.fulfill({ json: {
      ...clientApi.payment,
      body: [...clientApi.payment.body!, { ...clientApi.payment.body![0], detailSysId: 'FOREIGN', linkSysId: 'FOREIGN' }],
    } }));
  }
  if (mode === 'resume') {
    await consumer.route((url) => url.pathname === '/api/client/consumer/orders', (route) => route.fulfill({ json: {
      success: true, data: { orders: [{ orderId: clientApi.orderId, orderNo: '9001', status: 'RECEIVED',
        totalAmount: 8000, itemCount: 1, orderedAt: '2026-11-17 00:00:00' }] },
    } }));
  }
  return { manager, consumer, flow, consumerApi, clientApi };
}

test('실제 QA 주문/결제 실행기를 모의 API로 끝까지 검증한다', async ({ browser }, info) => {
  const api = await setup(browser);
  try {
    await runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info);
    expect(api.consumerApi.orderRequests).toHaveLength(1);
    expect(api.clientApi.statusRequests).toHaveLength(2);
    expect(api.clientApi.paymentRequests).toHaveLength(1);
  } finally { await api.manager.close(); }
});

test('한 자리 주문번호도 네 자리 Client 카드와 연결해 결제한다', async ({ browser }, info) => {
  const api = await setup(browser, 'short-number');
  try {
    await runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info);
    expect(api.consumerApi.orderRequests).toHaveLength(1);
    expect(api.clientApi.paymentRequests).toHaveLength(1);
    expect(JSON.parse(readFileSync(info.outputPath('order-payment-sanitized.json'), 'utf8')).orderId).toBe(api.clientApi.orderId);
  } finally { await api.manager.close(); }
});

test('지정한 기존 주문만 재개하고 새 주문을 만들지 않는다', async ({ browser }, info) => {
  const api = await setup(browser, 'resume');
  try {
    await runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info, api.clientApi.orderId);
    expect(api.consumerApi.orderRequests).toHaveLength(0);
    expect(api.clientApi.statusRequests).toHaveLength(2);
    expect(api.clientApi.paymentRequests).toHaveLength(1);
  } finally { await api.manager.close(); }
});

test('재개 주문 ID가 다르면 기존 주문도 변경하지 않는다', async ({ browser }, info) => {
  const api = await setup(browser, 'resume');
  try {
    await expect(runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info, '01M6N2PY8X87E9C3MVSA20MKVY')).rejects.toThrow('기존 주문 재개 조건 불일치');
    expect(api.consumerApi.orderRequests).toHaveLength(0);
    expect(api.clientApi.statusRequests).toHaveLength(0);
    expect(api.clientApi.paymentRequests).toHaveLength(0);
  } finally { await api.manager.close(); }
});

test('기존 주문이 있는 테이블에는 테스트 주문을 생성하지 않는다', async ({ browser }, info) => {
  const api = await setup(browser, 'occupied');
  try {
    await expect(runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info)).rejects.toThrow('기존 진행 주문');
    expect(api.consumerApi.orderRequests).toHaveLength(0);
    expect(api.clientApi.paymentRequests).toHaveLength(0);
  } finally { await api.manager.close(); }
});

test('QR 인증이 지연돼도 세션이 준비된 후 주문한다', async ({ browser }, info) => {
  const api = await setup(browser, 'delayed-qr');
  try {
    await runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info);
    expect(api.consumerApi.orderRequests).toHaveLength(1);
    expect(api.clientApi.paymentRequests).toHaveLength(1);
  } finally { await api.manager.close(); }
});

test('테이블 번호가 같아도 실제 매장과 테이블 ID가 다르면 주문하지 않는다', async ({ browser }, info) => {
  const api = await setup(browser, 'wrong-scope');
  try {
    await expect(runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info)).rejects.toThrow('실제 매장/테이블');
    expect(api.consumerApi.orderRequests).toHaveLength(0);
    expect(api.clientApi.paymentRequests).toHaveLength(0);
  } finally { await api.manager.close(); }
});

test('다른 주문이 섞인 결제 요청은 서버에 전송하지 않는다', async ({ browser }, info) => {
  const api = await setup(browser, 'foreign-payment');
  info.setTimeout(45_000);
  try {
    await expect(runOrderPayment(api.consumer, api.manager, 'E2E', api.flow, info)).rejects.toThrow('테스트 범위를 벗어난 Client 쓰기');
    expect(api.consumerApi.orderRequests).toHaveLength(1);
    expect(api.clientApi.paymentRequests).toHaveLength(0);
  } finally { await api.manager.close(); }
});
