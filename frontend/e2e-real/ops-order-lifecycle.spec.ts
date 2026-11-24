import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { assertIdentity, readQaConfig } from '../scripts/utils/real-qa-env.mjs';
import type { ConsumerOrderCreateResponse, ConsumerOrderDetailResponse, SettlementResponse } from '../src/generated/types';
import { addQaMenuToCart, openQaVisit, readActiveQaOrders, readJson, runOrderPayment, type Flow } from './order-payment';

const boardPath = '/client/order/status/management';
const orderPath = '/api/client/consumer/orders';
const statusPath = '/api/client/order_manage/status';
const eventNames = ['open', 'ORDER_STATUS_CHANGED', 'STATUS_CHANGED', 'VISIT_CLOSED'];

function configForOrders() {
  const config = readQaConfig(resolve(process.env.QA_ENV_FILE ?? '.env.qa.local'));
  const origin = new URL(config.baseURL);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) {
    throw new Error('주문 상태를 바꾸는 QA는 로컬 서버에서만 실행할 수 있습니다.');
  }
  const manager = config.accounts.find((account) => account.label === 'manager-a');
  return { ...config, manager };
}

async function login(context: BrowserContext, manager: NonNullable<ReturnType<typeof configForOrders>['manager']>) {
  const response = await context.request.post('/api/auth/login', {
    data: { userId: manager.id, userPassword: manager.password },
    timeout: 15_000,
    maxRetries: 0,
  });
  if (response.status() !== 200 || (await response.json()).success !== true) {
    throw new Error('QA 관리자 로그인 실패. 재시도하지 않습니다.');
  }
  const me = await context.request.get('/api/auth/me', { timeout: 15_000 });
  expect(me.status()).toBe(200);
  assertIdentity((await me.json()).data, manager);
}

async function observeEvents(page: Page) {
  await page.addInitScript((names) => {
    const received = new Map<string, number>();
    Object.defineProperty(window, 'qaEventCounts', { value: received });
    window.EventSource = class extends window.EventSource {
      constructor(url: string | URL, init?: EventSourceInit) {
        super(url, init);
        for (const name of names) {
          this.addEventListener(name, () => received.set(name, (received.get(name) ?? 0) + 1));
        }
      }
    };
  }, eventNames);
}

function eventCount(page: Page, name: string) {
  return page.evaluate((event) => (window as Window & { qaEventCounts?: Map<string, number> }).qaEventCounts?.get(event) ?? 0, name);
}

function orderCard(page: Page, order: { orderNo: string }, flow: Flow) {
  if (!/^\d+$/.test(order.orderNo)) throw new Error('주문번호 형식 오류');
  return page.getByRole('article').filter({
    hasText: new RegExp(`#${order.orderNo.padStart(4, '0')}\\b`),
  }).filter({ hasText: flow.menuName });
}

async function createQaOrder(page: Page, flow: Flow, knownMenuSysId?: string) {
  const menuSysId = await addQaMenuToCart(page, flow, knownMenuSysId);
  const allowOrderPath = (url: URL) => url.pathname === orderPath;
  let posted = false;
  await page.route(allowOrderPath, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fallback();
    if (request.method() !== 'POST' || posted) return route.abort('blockedbyclient');
    const items = request.postDataJSON()?.items;
    if (items?.length !== 1 || items[0].menuSysId !== menuSysId ||
        items[0].quantity !== 1 || items[0].options?.length !== 0) {
      return route.abort('blockedbyclient');
    }
    posted = true;
    return route.fallback();
  });
  try {
    await page.getByRole('button', { name: /개 담음/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: '주문하기', exact: true }).click();
    const [response] = await Promise.all([
      page.waitForResponse((r) => new URL(r.url()).pathname === orderPath && r.request().method() === 'POST'),
      page.getByRole('alertdialog', { name: '주문하시겠습니까?' }).getByRole('button', { name: '주문하기', exact: true }).click(),
    ]);
    expect(response.status()).toBe(201);
    const order: ConsumerOrderCreateResponse = (await response.json()).data;
    expect(order.orderId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    await expect(page.getByText('주문 완료', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '메뉴로 돌아가기', exact: true }).click();
    return { order, menuSysId };
  } finally {
    await page.unroute(allowOrderPath);
  }
}

async function assertOnlyQaOrders(client: Page, flow: Flow, expectedIds: string[]) {
  await expect.poll(async () => (await readActiveQaOrders(client, flow)).map(({ item }) => item.header?.sysId).sort())
    .toEqual([...expectedIds].sort());
}

async function orderMutation(client: Page, action: string, data: object) {
  const response = await client.request.post(`${statusPath}/${action}`, { data, timeout: 15_000 });
  const json = await response.json();
  expect(response.status(), `${action} / 응답 필드 ${Object.keys(json).join(',')}`).toBe(200);
  expect(json.success, action).toBe(true);
  return json.data;
}

test('AUTO-QA ops / 주문 수정, 취소, 미결제 마감, 정산 조회와 양방향 SSE', async ({ browser }, testInfo) => {
  const { baseURL, manager, orderFlow: flow } = configForOrders();
  test.skip(!flow, 'QA_ENABLE_ORDER_PAYMENT=1과 전용 주문 픽스처가 필요합니다.');
  if (!flow || !manager) throw new Error('QA 관리자와 주문 픽스처를 확인하세요.');
  const consumer = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  const client = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  const evidence: Record<string, unknown> = {};
  try {
    await login(client, manager);
    const board = await client.newPage();
    const page = await consumer.newPage();
    await Promise.all([observeEvents(board), observeEvents(page)]);
    await board.goto(boardPath);
    await assertOnlyQaOrders(board, flow, []);
    const visit = await openQaVisit(page, manager.store, flow);
    evidence.tableNum = visit.tableNum;
    await expect.poll(() => eventCount(board, 'open')).toBeGreaterThan(0);
    await expect.poll(() => eventCount(page, 'open')).toBeGreaterThan(0);

    const { order, menuSysId } = await test.step('Consumer 주문이 Client SSE로 표시된다', async () => {
      const before = await eventCount(board, 'ORDER_STATUS_CHANGED');
      const created = await createQaOrder(page, flow);
      evidence.consumerOrderId = created.order.orderId;
      await expect.poll(() => eventCount(board, 'ORDER_STATUS_CHANGED')).toBeGreaterThan(before);
      await expect(orderCard(board, created.order, flow)).toBeVisible();
      evidence.consumerToClientSse = true;
      return created;
    });

    const revised = await test.step('Client 수정이 Consumer SSE와 내역에 반영된다', async () => {
      await assertOnlyQaOrders(board, flow, [order.orderId]);
      const detailResponse = await readJson(page, `${orderPath}/${order.orderId}`);
      expect(detailResponse.status).toBe(200);
      const detail: ConsumerOrderDetailResponse = detailResponse.data.data;
      expect(detail.items).toHaveLength(1);
      expect(detail.items[0]?.menuName).toBe(flow.menuName);
      await page.getByRole('button', { name: /주문내역/ }).click();
      const history = page.getByRole('dialog', { name: '주문내역', exact: true });
      const historyOrder = (orderNo: string) => history.locator('.order-history-group').filter({
        has: page.getByText(`#${orderNo}`, { exact: true }),
      });
      await expect(historyOrder(order.orderNo).getByText(flow.menuName, { exact: true })).toBeVisible();
      const before = await eventCount(page, 'STATUS_CHANGED');
      const [response, data] = await Promise.all([
        page.waitForResponse((r) => new URL(r.url()).pathname === orderPath && r.request().method() === 'GET'),
        orderMutation(board, 'revise_order', {
          clientRequestId: randomUUID(),
          orderGroupIds: [order.orderId],
          removeDetailIds: [detail.items[0]!.orderItemId],
          addedItems: [{ menuSysId, quantity: 2, options: [] }],
        }),
      ]);
      expect(data.cancelledOrderGroupIds).toEqual([order.orderId]);
      const replacement = { orderId: data.createdOrderId, orderNo: data.createdOrderNo };
      expect(replacement.orderId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      evidence.revisedOrderId = replacement.orderId;
      await expect.poll(() => eventCount(page, 'STATUS_CHANGED')).toBeGreaterThan(before);
      expect(response.status()).toBe(200);
      expect((await response.json()).data.orders).toEqual(expect.arrayContaining([
        expect.objectContaining({ orderId: replacement.orderId, itemCount: 2 }),
      ]));
      await expect(historyOrder(replacement.orderNo).getByText('2개', { exact: true })).toBeVisible();
      await expect(orderCard(board, replacement, flow)).toBeVisible();
      evidence.clientToConsumerSse = true;
      await history.getByRole('button', { name: '확인', exact: true }).click();
      return replacement;
    });

    const finalOrder = await createQaOrder(page, flow, menuSysId);
    await test.step('기존 수정 주문만 취소한다', async () => {
      await assertOnlyQaOrders(board, flow, [revised.orderId, finalOrder.order.orderId]);
      const active = await readActiveQaOrders(board, flow);
      const header = active.find(({ item }) => item.header?.sysId === revised.orderId)?.item.header;
      expect(header?.sysId).toBe(revised.orderId);
      await orderMutation(board, 'cancel_order', { header, cancelType: 'CUSTOMER_REQUEST', cancelReason: '' });
      await assertOnlyQaOrders(board, flow, [finalOrder.order.orderId]);
      const cancelled = await readJson(page, `${orderPath}/${revised.orderId}`);
      expect(cancelled.status).toBe(200);
      expect(cancelled.data.data.status).toBe('CANCELLED');
      evidence.cancelledOrderId = revised.orderId;
    });

    await test.step('남은 주문만 미결제로 마감하고 정산을 조회한다', async () => {
      const { orderId } = finalOrder.order;
      const payment = await readJson(board, `${statusPath}/get_payment_complete?sysId=${orderId}`);
      expect(payment.status).toBe(200);
      expect(payment.data.body.map((row: { linkSysId: string }) => row.linkSysId)).toEqual([orderId]);
      expect(payment.data.header?.sysId).toBe(visit.consumerSessionId);
      const before = await eventCount(page, 'VISIT_CLOSED');
      await orderMutation(board, 'not_payment_complete', {
        orderInfo: payment.data.header,
        unpaidReason: 'OTHER',
        unpaidDescription: 'AUTO-QA ops 미결제 마감',
      });
      await expect.poll(() => eventCount(page, 'VISIT_CLOSED')).toBeGreaterThan(before);
      await expect(page.getByText('주문이 마감되었습니다.', { exact: true })).toBeVisible();
      await assertOnlyQaOrders(board, flow, []);
      evidence.unpaidOrderId = orderId;
      const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
      await board.goto('/client/payment/calculation/list');
      const settlement = await readJson(board, `/api/client/payment_manage/settlement/search?searchStartDate=${date}&searchEndDate=${date}`);
      expect(settlement.status).toBe(200);
      const result: SettlementResponse = settlement.data;
      expect(result).toEqual(expect.objectContaining({
        orderCount: expect.any(Number),
        netPrice: expect.any(Number),
        dailySales: expect.any(Array),
      }));
      evidence.settlement = { status: settlement.status, orderCount: result.orderCount };
    });
  } finally {
    await testInfo.attach('ops-sanitized', { body: JSON.stringify(evidence), contentType: 'application/json' });
    await Promise.all([consumer.close(), client.close()]);
  }
});

test('AUTO-QA ops / 결제 후 방문 종료, 장바구니 정리와 QR 재스캔', async ({ browser }, testInfo) => {
  const { baseURL, manager, orderFlow: flow } = configForOrders();
  test.skip(!flow, 'QA_ENABLE_ORDER_PAYMENT=1과 전용 주문 픽스처가 필요합니다.');
  if (!flow || !manager) throw new Error('QA 관리자와 주문 픽스처를 확인하세요.');
  const client = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  try {
    await login(client, manager);
    const consumer = await browser.newContext({ baseURL, serviceWorkers: 'block' });
    await runOrderPayment(consumer, client, manager.store, flow, testInfo, process.env.QA_RESUME_ORDER_ID, true);
  } finally {
    await client.close();
  }
});

