import { expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import type { StatusResponse, ConsumerOrderCreateResponse, ConsumerSessionResponse } from '../src/generated/types';
import { writeFileSync } from 'node:fs';

export type Flow = { qrPath: string; tableSysId: string; tableNum: number; menuName: string };

export async function readJson(page: Page, path: string) {
  return page.evaluate(async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    return { status: response.status, data: await response.json() };
  }, path);
}

export async function openQaVisit(page: Page, store: string, flow: Flow) {
  // QR/session connection is a GET with side effects: validate immediately afterward.
  const [qr] = await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname.startsWith('/api/qr/') && response.request().method() === 'GET', { timeout: 15_000 }),
    page.goto(flow.qrPath),
  ]);
  if (qr.status() !== 200 || (await qr.json()).success !== true) throw new Error('QR 인증 실패. 주문을 중단합니다.');
  await page.waitForURL((url) => url.pathname === '/consumer/order', { timeout: 15_000 })
    .catch(() => { throw new Error('QR 인증 후 주문 화면 전환 실패'); });
  const sessionResponse = await readJson(page, '/api/client/consumer/session');
  if (sessionResponse.status !== 200) throw new Error('Consumer 세션 생성 실패');
  const session = sessionResponse.data.data;
  const scopeChecks = {
    QA_STORE_A_CODE: session?.sysPlantCd === store,
    QA_TABLE_SYS_ID: session?.tableSysId === flow.tableSysId,
    QA_TABLE_NUM: session?.tableNum === flow.tableNum,
    ACTIVE: session?.status === 'ACTIVE',
    orderingAllowed: session?.orderingAllowed === true,
  };
  const mismatches = Object.entries(scopeChecks).filter(([, matches]) => !matches).map(([key]) => key);
  if (mismatches.length) throw new Error(`QR의 실제 매장/테이블/주문 허용 상태 불일치: ${mismatches.join('/')}. 주문을 중단합니다.`);
  return session as ConsumerSessionResponse;
}

export async function readActiveQaOrders(client: Page, flow: Flow) {
  const current = await readJson(client, '/api/client/order_manage/status/search');
  if (current.status !== 200) throw new Error('테이블 기존 주문 확인 실패');
  const groups: StatusResponse[] = current.data;
  if (!Array.isArray(groups)) throw new Error('주문현황 응답 계약 불일치');
  return groups.filter((group) => ['01', '02', '03'].includes(group.statusFlag ?? ''))
    .flatMap((group) => (group.statusList ?? []).filter((item) => item.header?.tableNum === flow.tableNum)
      .map((item) => ({ status: group.statusFlag, item })));
}

export async function addQaMenuToCart(page: Page, flow: Flow, knownMenuSysId?: string): Promise<string> {
  const menuResponse = knownMenuSysId ? undefined : page.waitForResponse((r) => {
    const path = new URL(r.url()).pathname;
    return /\/api\/client\/consumer\/menu\/[^/]+$/.test(path) && !path.endsWith('/main') && !path.endsWith('/search');
  });
  await page.getByRole('button', { name: flow.menuName, exact: false }).click();
  const menuResult = await menuResponse;
  let menuSysId = knownMenuSysId;
  if (menuResult) {
    if (menuResult.status() !== 200) throw new Error('테스트 메뉴 상세 조회 실패');
    const detail = (await menuResult.json()).data?.body;
    if (detail?.menuName !== flow.menuName || detail?.soldOutYn !== 'N' || detail?.optionGroupList?.length !== 0) {
      throw new Error('판매 가능한 옵션 없는 AUTO-QA 메뉴 계약 불일치');
    }
    menuSysId = detail.menuSysId;
  }
  if (!menuSysId) throw new Error('테스트 메뉴 식별자 누락');
  const dialog = page.getByRole('dialog');
  if (await dialog.getByRole('radio').count() || await dialog.getByRole('checkbox').count()) {
    throw new Error('옵션 없는 AUTO-QA 메뉴를 지정하세요. 임의 옵션 선택은 하지 않습니다.');
  }
  await dialog.getByRole('button', { name: /장바구니에 담기/ }).click();
  return menuSysId;
}

/** Exact order IDs fence every write; payment must contain only the newly created order. */
export async function runOrderPayment(consumer: BrowserContext, manager: BrowserContext,
  store: string, flow: Flow, testInfo: TestInfo, resumeOrderId?: string, verifyVisitRollover = false) {
  const runId = `AUTO-QA-${verifyVisitRollover ? 'ops-' : ''}${new Date().toISOString()}`;
  let order: ConsumerOrderCreateResponse | undefined;
  const blocked: string[] = [];
  const steps: string[] = [];
  const evidencePath = testInfo.outputPath('order-payment-sanitized.json');
  const saveEvidence = () => writeFileSync(evidencePath, JSON.stringify({ runId, orderId: order?.orderId ?? null, steps, blocked }));
  let orderPosts = 0;
  let menuSysId: string | undefined;
  let denyWrite!: (reason: string) => void;
  const deniedWrite = new Promise<string>((resolve) => { denyWrite = resolve; });
  async function requireAllowed<T>(pending: Promise<T>): Promise<T> {
    return Promise.race([pending, deniedWrite.then((reason) => { throw new Error(reason); })]);
  }
  try {
    if (resumeOrderId && !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(resumeOrderId)) throw new Error('QA_RESUME_ORDER_ID 형식 오류');
    const page = await consumer.newPage();
    const client = await manager.newPage();
    await client.goto('/client/order/status/management');
    const session = await openQaVisit(page, store, flow);
    steps.push('QR 인증 200');
    const active = await readActiveQaOrders(client, flow);
    if (resumeOrderId) {
      const history = await readJson(page, '/api/client/consumer/orders');
      if (history.status !== 200 || !Array.isArray(history.data.data?.orders) ||
          !history.data.data.orders.some((row: { orderId?: string }) => row.orderId === resumeOrderId)) {
        throw new Error('기존 주문 재개 조건 불일치: 현재 Consumer 방문의 주문이 아닙니다.');
      }
      const target = active[0];
      const item = target?.item;
      const menus = item?.body?.filter((row) => row.rowType === 'MENU') ?? [];
      const orderNum = item?.orderNum ?? item?.header?.orderNum;
      if (active.length !== 1 || item?.header?.sysId !== resumeOrderId || target?.status !== '01' ||
          menus.length !== 1 || menus[0].itemName !== flow.menuName || menus[0].qty !== 1 ||
          item?.body?.some((row) => row.rowType !== 'MENU') ||
          !Number.isSafeInteger(orderNum) || Number(orderNum) < 1 || !item?.header?.orderDatetime) {
        throw new Error('기존 주문 재개 조건 불일치. 새 주문/상태 변경/결제를 실행하지 않습니다.');
      }
      order = { orderId: resumeOrderId, orderNo: String(orderNum), status: 'RECEIVED',
        totalAmount: item.footer?.totalPrice ?? menus[0].price ?? 0, orderedAt: item.header.orderDatetime };
      steps.push('지정한 기존 접수 주문 재개 / 신규 주문 없음');
      saveEvidence();
    } else if (active.length) {
      throw new Error('테스트 테이블에 기존 진행 주문이 있습니다. 결제 범위 보호를 위해 중단합니다.');
    }
    if (!order) {
      await consumer.route('**/api/**', async (route) => {
        const request = route.request();
        if (request.method() === 'GET') return route.fallback();
        const path = new URL(request.url()).pathname;
        if (['/api/log/log/menu_open_access_log', '/api/log/log/menu_close_access_log'].includes(path) && request.method() === 'POST') return route.fallback();
        const body = request.postDataJSON();
        if (path === '/api/client/consumer/orders' && request.method() === 'POST' && ++orderPosts === 1 &&
            menuSysId && body?.items?.length === 1 && body.items[0].menuSysId === menuSysId &&
            body.items[0].quantity === 1 && body.items[0].options?.length === 0) {
          return route.fallback();
        }
        blocked.push('consumer-write');
        denyWrite('테스트 범위를 벗어난 Consumer 쓰기를 차단했습니다.');
        return route.abort('blockedbyclient');
      });
      await expect(page).toHaveURL(/\/consumer\/order$/);
      menuSysId = await addQaMenuToCart(page, flow);
      await page.getByRole('button', { name: /개 담음/ }).click();
      await page.getByRole('dialog').getByRole('button', { name: '주문하기', exact: true }).click();
      const created = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/client/consumer/orders' && response.request().method() === 'POST');
      await page.getByRole('alertdialog', { name: '주문하시겠습니까?' }).getByRole('button', { name: '주문하기', exact: true }).click();
      const response = await requireAllowed(created);
      if (response.status() !== 201) throw new Error('주문 생성 실패. 자동 재시도하지 않습니다.');
      const json = await response.json();
      order = json.data ?? json;
      if (!order?.orderId || !order.orderNo) throw new Error('주문 식별자 응답 누락');
      steps.push('Consumer 주문 201');
      saveEvidence();
      await expect(page.getByText('주문 완료', { exact: true })).toBeVisible();
    }
    const orderId = order.orderId;
    await manager.route('**/api/**', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') return route.fallback();
      const path = new URL(req.url()).pathname;
      if (['/api/log/log/menu_open_access_log', '/api/log/log/menu_close_access_log'].includes(path) && req.method() === 'POST') return route.fallback();
      const body = req.postDataJSON();
      const statePath = ['/api/client/order_manage/status/go_to_cooking', '/api/client/order_manage/status/go_to_serving_complete'].includes(path);
      const paymentPath = path === '/api/client/order_manage/status/payment_complete';
      const ownState = statePath && body?.header?.sysId === orderId;
      const ownPayment = paymentPath && Array.isArray(body?.body) && body.body.length > 0 &&
        body.body.every((row: { linkSysId?: string }) => row.linkSysId === orderId);
      if (req.method() === 'POST' && (ownState || ownPayment)) return route.fallback();
      blocked.push('manager-write');
      denyWrite('테스트 범위를 벗어난 Client 쓰기를 차단했습니다.');
      return route.abort('blockedbyclient');
    });
    await client.goto('/client/order/status/management');
    if (!/^\d+$/.test(order.orderNo)) throw new Error('주문번호 형식 오류');
    const card = client.getByRole('article').filter({ hasText: new RegExp(`#${order.orderNo.padStart(4, '0')}\\b`) }).filter({ hasText: flow.menuName });
    await expect(card).toHaveCount(1);
    for (const [button, endpoint] of [
      ['조리시작', 'go_to_cooking'], ['서빙완료', 'go_to_serving_complete'],
    ]) {
      const changed = client.waitForResponse((r) => new URL(r.url()).pathname.endsWith(`/status/${endpoint}`) && r.request().method() === 'POST');
      await card.getByRole('button', { name: button, exact: true }).click();
      expect((await requireAllowed(changed)).status()).toBe(200);
      steps.push(button);
    }
    await card.getByRole('button', { name: '결제처리', exact: true }).click();
    await client.getByRole('button', { name: '결제완료', exact: true }).click();
    const receipt = client.getByRole('dialog', { name: '결제 완료 처리' });
    await expect(receipt).toBeVisible();
    await receipt.getByText('카드', { exact: true }).click();
    if (verifyVisitRollover) {
      if (!resumeOrderId) {
        await page.getByRole('button', { name: '메뉴로 돌아가기', exact: true }).click();
      }
      await addQaMenuToCart(page, flow, menuSysId);
      await expect(page.getByRole('button', { name: /개 담음/ })).toBeVisible();
    }
    const paid = client.waitForResponse((r) => new URL(r.url()).pathname.endsWith('/status/payment_complete') && r.request().method() === 'POST');
    await receipt.getByRole('button', { name: '확인', exact: true }).click();
    expect((await requireAllowed(paid)).status()).toBe(200);
    steps.push('결제 200');
    await expect(client.getByText('결제완료 되었습니다.', { exact: true })).toBeVisible();
    await expect.poll(async () => {
      const r = await readJson(page, '/api/client/consumer/session');
      return r.status === 200 ? r.data.data?.status : `HTTP-${r.status}`;
    }, { timeout: 15_000, intervals: [3000] }).toBe('CLOSED');
    steps.push('Consumer CLOSED');
    if (verifyVisitRollover) {
      await expect(page.getByText('주문이 마감되었습니다.', { exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => {
        const savedCart = localStorage.getItem('qr-order:consumer-cart');
        return savedCart ? JSON.parse(savedCart).state?.cart : undefined;
      })).toEqual([]);
      steps.push('Consumer 마감 안내 표시 / 장바구니 저장값 비움');
      const newVisit = await openQaVisit(page, store, flow);
      expect(newVisit.consumerSessionId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(newVisit.consumerSessionId).not.toBe(session.consumerSessionId);
      await expect(page.getByRole('button', { name: flow.menuName, exact: false })).toBeVisible();
      await expect(page.getByRole('button', { name: /개 담음/ })).toHaveCount(0);
      const history = await readJson(page, '/api/client/consumer/orders');
      expect(history.status).toBe(200);
      expect(history.data.data.orders).toEqual([]);
      steps.push('같은 QR / 새 방문 ID / 빈 장바구니와 주문내역');
    }
    expect(blocked).toEqual([]);
  } finally {
    saveEvidence();
    await testInfo.attach('order-payment-sanitized', {
      path: evidencePath, contentType: 'application/json',
    });
    await consumer.close();
  }
}
