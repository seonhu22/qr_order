import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';

const baseURL = 'http://localhost:3000';
const auth = '/api/auth';
const users = '/api/client/store_manage/user_manage';
const menus = '/api/client/menu_manage';
const userPage = '/client/store/user/management';
const menuPages = [
  ['/client/menu/info/management', '메뉴 관리'],
  ['/client/menu/info/option', '옵션 관리'],
] as const;
const password = process.env.QA_AUTH_FIXTURE_PASSWORD;
const initialPassword = process.env.QA_AUTH_INITIAL_PASSWORD;
const run = randomBytes(4).toString('hex');
const newPassword = `Qa!${randomBytes(12).toString('hex')}`;

function db(sql: string): string {
  const { PGHOST, PGPORT, PGDATABASE, QA_AUTH_PSQL } = process.env;
  if (PGHOST !== '127.0.0.1' || PGPORT !== '55432' || PGDATABASE !== 'qrdemo' || !QA_AUTH_PSQL) {
    throw new Error('로컬 qrdemo 연결과 QA_AUTH_PSQL을 확인하세요.');
  }
  return execFileSync(QA_AUTH_PSQL, ['-X', '-w', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8', timeout: 8_000,
  }).trim();
}

async function request(session: APIRequestContext, method: 'GET' | 'POST', path: string, data?: unknown) {
  const response = await session.fetch(path, { method, data, timeout: 8_000, maxRedirects: 0 });
  const body = await response.json().catch(() => undefined);
  const shape = Array.isArray(body) ? `array(${body.length})` : body && typeof body === 'object'
    ? `{${Object.keys(body).join(',')}}` : typeof body;
  const details = path === `${auth}/login` && typeof body?.data === 'number'
    ? ` data=${body.data} locked=${/사용 중지/.test(body.message ?? '')}` : '';
  console.log(`${method} ${path} -> ${response.status()} ${shape}${details}`);
  return { status: response.status(), body };
}

async function step(label: string, action: () => Promise<void>) {
  try {
    await action();
    console.log(`${label} PASS`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${label} FAIL ${message.split('\n')[0]}`);
    expect.soft(false, label).toBe(true);
  }
}

function fixturePassword(): string {
  if (!password) throw new Error('QA_AUTH_FIXTURE_PASSWORD가 필요합니다.');
  return password;
}

async function signIn(session: APIRequestContext, userId: string, store: string, role: string, pwd = fixturePassword(), initial = false) {
  const result = await request(session, 'POST', `${auth}/login`, { userId, userPassword: pwd });
  expect(result.status, `${userId} 로그인`).toBe(200);
  expect(result.body?.success).toBe(true);
  const me = await request(session, 'GET', `${auth}/me`);
  expect(me.status).toBe(200);
  expect(me.body?.data).toMatchObject({ userId, sysPlantCd: store, staffRole: role, initPwdRequired: initial });
}

async function browserLogin(page: Page, userId: string, pwd: string) {
  await page.goto('/client/login');
  await page.getByLabel('아이디', { exact: true }).fill(userId);
  await page.getByLabel('비밀번호', { exact: true }).fill(pwd);
  const pending = page.waitForResponse((response) => new URL(response.url()).pathname === `${auth}/login`);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  const response = await pending;
  const body = await response.json();
  console.log(`브라우저 POST ${auth}/login -> ${response.status()} {${Object.keys(body).join(',')}}`
    + (typeof body.data === 'number' ? ` data=${body.data}` : ''));
  return { status: response.status(), body };
}

async function switchAccount(page: Page, userId: string) {
  const logout = await request(page.request, 'POST', `${auth}/logout`);
  expect(logout.status).toBe(200);
  expect((await request(page.request, 'GET', `${auth}/me`)).status).toBe(401);
  expect((await browserLogin(page, userId, fixturePassword())).status).toBe(200);
  await expect(page).toHaveURL(/\/client\/main$/);
}

test('메뉴 / 결제 상세 매장 권한', async ({ browser }) => {
  const [a, b, staff] = await Promise.all([1, 2, 3].map(() => browser.newContext({ baseURL, serviceWorkers: 'block' })));
  try {
    await signIn(a.request, 'demo_owner', 'DEMO01', '01');
    await signIn(b.request, 'autoqa_manager_b', 'AUTOQA_B', '01');
    await signIn(staff.request, 'autoqa_staff_a', 'DEMO01', '02');

    await step('SEC-02', async () => {
      const reads = db(`select distinct on (om.sys_plant_cd) om.sys_plant_cd, om.sys_id
        from order_master om join order_group og on og.link_sys_id = om.sys_id
        join order_detail od on od.link_sys_id3 = og.sys_id
        where om.sys_plant_cd in ('DEMO01','AUTOQA_B') and od.payment_yn = 'Y'
        and not exists (select 1 from client_order_revision_removed_detail r where r.order_detail_sys_id = od.sys_id)
        order by om.sys_plant_cd, om.sys_id desc`).split(/\r?\n/);
      expect(reads.length).toBeGreaterThan(0);
      for (const row of reads) {
        const [store, id] = row.split('|');
        const path = `/api/client/payment_manage/history/detail/search/${id}`;
        const [own, other] = store === 'DEMO01' ? [a, b] : [b, a];
        console.log(`결제 상세 매장=${store}`);
        const allowed = await request(own.request, 'GET', path);
        const denied = await request(other.request, 'GET', `${path}?sysPlantCd=${store}`);
        const deniedPlain = await request(other.request, 'GET', path);
        expect(allowed.status).toBe(200);
        expect(Array.isArray(allowed.body) && allowed.body.length > 0).toBe(true);
        expect(denied).toEqual({ status: 200, body: [] });
        expect(deniedPlain).toEqual({ status: 200, body: [] });
      }
    });

    const page = await a.newPage();
    await step('AUTHZ-01 관리자 메뉴/옵션 직접 조회', async () => {
      for (const [path, label] of menuPages) {
        const read = page.waitForResponse((response) => new URL(response.url()).pathname.startsWith(`${menus}/`));
        await page.goto(path);
        const response = await read;
        console.log(`${path} -> GET ${new URL(response.url()).pathname} ${response.status()}`);
        expect(response.status()).toBe(200);
        await expect(page.getByRole('region', { name: label, exact: true })).toBeVisible();
      }
    });

    await step('AUTHZ-01 관리자 내비게이션', async () => {
      const catalog = await request(a.request, 'GET', '/api/system/settings/menu/search');
      expect(catalog.status).toBe(200);
      const paths = new Set<string>(catalog.body.map((item: { menuUrl: string }) => item.menuUrl));
      console.log(`카탈로그 관리 경로=${menuPages.map(([path]) => `${path}:${paths.has(path)}`).join(',')}`);
      const header = page.getByRole('navigation', { name: '상단 메뉴' });
      console.log(`관리자 상단 메뉴=${(await header.getByRole('button').allTextContents()).join('/')}`);
      const sidebar = page.getByRole('navigation', { name: '사이드 메뉴' });
      for (const [, label] of menuPages) await expect(sidebar.getByRole('button', { name: label, exact: true })).toBeVisible();
    });

    await step('AUTHZ-01 스태프 GET/POST', async () => {
      const read = await request(staff.request, 'GET', `${menus}/menu/master/search`);
      // A missing target keeps the denied write inert even if authorization regresses.
      const write = await request(staff.request, 'POST', `${menus}/menu/master/update`, {
        sysId: run, categoryName: `AUTO-QA auth ${run}`, useYn: 'Y', ordNo: 1,
      });
      expect(read.status).toBe(403);
      expect(write.status).toBe(403);
    });

    await step('AUTHZ-01 스태프 직접 URL/변형/계정 전환', async () => {
      await switchAccount(page, 'autoqa_staff_a');
      const hits: string[] = [];
      page.on('request', (call) => {
        const path = new URL(call.url()).pathname;
        if (path.startsWith(`${menus}/`)) hits.push(path);
      });
      for (const path of [...menuPages.map(([route]) => route), '/CLIENT/MENU/INFO/OPTION', '/client/%6denu/info/option']) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/client\/main$/);
        await expect(page.getByRole('navigation', { name: '매장 운영 바로가기' })).toBeVisible();
        console.log(`${path} -> /client/main`);
      }
      const side = page.getByRole('navigation', { name: '사이드 메뉴' });
      const menuTab = page.getByRole('navigation', { name: '상단 메뉴' }).getByRole('button', { name: '메뉴', exact: true });
      await menuTab.click();
      const group = side.getByRole('button', { name: '메뉴 정보 관리', exact: true });
      if (await group.getAttribute('aria-expanded') === 'false') await group.click();
      await expect(side.getByRole('button', { name: '직원호출 관리', exact: true })).toBeVisible();
      for (const [, label] of menuPages) await expect(side.getByRole('button', { name: label, exact: true })).toHaveCount(0);
      console.log('스태프 메뉴 정보 관리: 직원호출 표시 / 메뉴·옵션 관리 미표시');
      expect(hits).toEqual([]);
    });

    await step('AUTHZ-01 기존 업무 조회', async () => {
      const readOnly = await staff.newPage();
      await readOnly.route((url) => url.pathname.startsWith('/api/'), (route) => {
        const call = route.request();
        const audit = ['/api/log/log/menu_open_access_log', '/api/log/log/menu_close_access_log'];
        return call.method() === 'GET' || audit.includes(new URL(call.url()).pathname)
          ? route.fallback() : route.abort('blockedbyclient');
      });
      const pages = [
        ['/client/menu/info/staff-call', '직원호출 관리', '/api/client/staff-call/settings'],
        ['/client/order/status/management', '주문 상태 관리', '/api/client/order_manage/status/search'],
        ['/client/payment/status/list', '결제 목록 조회', '/api/client/payment_manage/history/master/search'],
      ];
      for (const [path, label, api] of pages) {
        const read = readOnly.waitForResponse((response) => new URL(response.url()).pathname === api);
        await readOnly.goto(path);
        const response = await read;
        console.log(`${path} -> GET ${api} ${response.status()}`);
        expect(response.status()).toBe(200);
        await expect(readOnly.getByRole('region', { name: label, exact: true })).toBeVisible();
      }
    });
  } finally {
    await Promise.all([a, b, staff].map((context) => context.close()));
  }
});

type User = { sysId: string; userId: string; userNm: string; userRole: string; plantCd: string };

async function list(session: APIRequestContext, keyword = ''): Promise<User[]> {
  const result = await request(session, 'GET', `${users}/search?searchKeyword=${encodeURIComponent(keyword)}`);
  expect(result.status).toBe(200);
  expect(Array.isArray(result.body)).toBe(true);
  return result.body;
}

async function create(session: APIRequestContext, label: string): Promise<User> {
  const userId = `AUTO-QA-auth-${label}-${run}`;
  const userNm = `AUTO-QA auth ${label} ${run}`;
  expect((await request(session, 'POST', `${users}/new`, { userId, userNm })).status).toBe(200);
  const [record] = await list(session, userId);
  expect(record).toMatchObject({ userId, userNm, userRole: '02' });
  return record;
}

function state(user: User): string {
  expect(user.userId).toMatch(/^AUTO-QA-auth-[a-z]+-[a-f0-9]{8}$/);
  return db(`select plant_cd, sys_plant_cd, user_role, init_yn, password_fail_cnt, delete_yn
    from sys_user where user_id = '${user.userId}'`);
}

async function useInitialPassword(context: BrowserContext, user: User, store: string, pwd: string) {
  const page = await context.newPage();
  expect((await browserLogin(page, user.userId, pwd)).status).toBe(200);
  const me = await request(context.request, 'GET', `${auth}/me`);
  expect(me.body?.data).toMatchObject({ userId: user.userId, sysPlantCd: store, staffRole: '02', initPwdRequired: true });
  await expect(page.getByRole('heading', { name: '비밀번호 변경', exact: true })).toBeVisible();
  return page;
}

async function changeOwnPassword(page: Page, user: User) {
  await page.getByLabel('새 비밀번호', { exact: true }).fill(newPassword);
  await page.getByLabel('비밀번호 확인', { exact: true }).fill(newPassword);
  const pending = page.waitForResponse((response) => new URL(response.url()).pathname === `${auth}/init-pwd-active`);
  await page.getByRole('button', { name: '변경하기', exact: true }).click();
  const response = await pending;
  console.log(`POST ${auth}/init-pwd-active?userId=${user.userId} -> ${response.status()}`);
  expect(response.status()).toBe(200);
  expect((await response.json())?.success).toBe(true);
  await expect(page.getByText(/비밀번호가 성공적으로 변경되었습니다/)).toBeVisible();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  const me = await request(page.request, 'GET', `${auth}/me`);
  expect(me.body?.data).toMatchObject({ initPwdRequired: false });
}

test('사용자 관리 / 신규 스태프 / 초기화', async ({ browser }) => {
  const [a, b, admin, staff, own] = await Promise.all([1, 2, 3, 4, 5].map(() => browser.newContext({ baseURL, serviceWorkers: 'block' })));
  let primary: User | undefined;
  let foreign: User | undefined;
  let promote: User | undefined;
  try {
    await signIn(a.request, 'demo_owner', 'DEMO01', '01');
    await signIn(b.request, 'autoqa_manager_b', 'AUTOQA_B', '01');
    await signIn(admin.request, 'demo_admin', 'ADMIN', '01');
    await signIn(staff.request, 'autoqa_staff_a', 'DEMO01', '02');
    const record = primary = await create(a.request, 'staff');
    const other = foreign = await create(b.request, 'other');
    const target = promote = await create(a.request, 'promote');
    const manager = (await list(a.request, 'demo_owner')).find((row) => row.userId === 'demo_owner');
    expect(manager).toBeDefined();
    const page = await a.newPage();
    await page.goto(userPage);
    if (!initialPassword) throw new Error('QA_AUTH_INITIAL_PASSWORD가 필요합니다.');

    await step('AUTH-STAFF 신규 DB/목록', async () => {
      const before = state(record);
      console.log(`신규 DB ${before}`);
      expect(before).toBe('DEMO01|DEMO01|02|Y|0|N');
      await page.reload();
      await expect(page.getByRole('cell', { name: record.userId, exact: true })).toBeVisible();
    });

    await step('AUTH-STAFF 안내값으로 최초 로그인/변경', async () => {
      const firstLogin = await useInitialPassword(own, record, 'DEMO01', initialPassword);
      await changeOwnPassword(firstLogin, record);
      await signIn(own.request, record.userId, 'DEMO01', '02', newPassword);
    });

    await step('USER-01 관리자 행/이메일 안내', async () => {
      const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'demo_owner', exact: true }) });
      await expect(row).toBeVisible();
      await expect(row.getByRole('button', { name: /수정/ })).toHaveCount(0);
      await expect(row.getByRole('checkbox')).toHaveCount(0);
      await row.getByRole('button', { name: /초기화/ }).click();
      await expect(page.getByText(/관리자에게 이메일로 요청/)).toBeVisible();
      await page.getByRole('button', { name: '확인', exact: true }).click();
    });

    await step('USER-01 정상 수정 및 범위 제한', async () => {
      const update = { ...record, userNm: `AUTO-QA auth updated ${run}` };
      expect((await request(a.request, 'POST', `${users}/update`, update)).status).toBe(200);
      expect((await list(a.request, record.userId))[0].userNm).toBe(update.userNm);
      const denied = [
        await request(a.request, 'POST', `${users}/update`, { ...update, userRole: '01' }),
        await request(a.request, 'POST', `${users}/update`, { ...update, plantCd: 'AUTOQA_B' }),
        await request(a.request, 'POST', `${users}/update`, { sysId: other.sysId, userNm: update.userNm }),
        await request(a.request, 'POST', `${users}/del`, [{ sysId: record.sysId }, { sysId: other.sysId }]),
        await request(staff.request, 'GET', `${users}/search`),
        await request(staff.request, 'POST', `${users}/update`, update),
      ];
      expect(denied.map(({ status }) => status)).toEqual([403, 403, 403, 403, 403, 403]);
      expect((await list(a.request, record.userId))[0]).toMatchObject({ userRole: '02', plantCd: 'DEMO01', userNm: update.userNm });
      expect((await list(b.request, other.userId))[0]).toMatchObject({ userNm: other.userNm });
    });

    await step('SEC-01 동일 매장 초기화/실패 횟수 복구', async () => {
      const wrong = await request(own.request, 'POST', `${auth}/login`, { userId: record.userId, userPassword: `wrong-${run}` });
      expect(wrong.status).toBe(401);
      expect(Number(state(record).split('|')[4])).toBeGreaterThan(0);
      const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: record.userId, exact: true }) });
      await row.getByRole('button', { name: /초기화/ }).click();
      const pending = page.waitForResponse((response) => new URL(response.url()).pathname === `${users}/reset_pwd/${record.sysId}`);
      await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
      const response = await pending;
      const body = await response.json();
      console.log(`POST ${users}/reset_pwd/${record.sysId} -> ${response.status()} {${Object.keys(body).join(',')}}`);
      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      const reset = state(record);
      console.log(`초기화 DB ${reset}`);
      expect(reset).toBe('DEMO01|DEMO01|02|Y|0|N');
      await expect(page.getByText(`초기 비밀번호는 ${initialPassword} 입니다.`, { exact: true })).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    });

    await step('SEC-01 매장 초기화 후 강제 변경', async () => {
      const resetPage = await useInitialPassword(own, record, 'DEMO01', initialPassword);
      await changeOwnPassword(resetPage, record);
    });

    await step('SEC-01 Admin 지원 초기화/본인 변경', async () => {
      const data = { password: newPassword, chkPassword: newPassword };
      const support = `${auth}/init-pwd?userId=${record.userId}`;
      expect((await request(a.request, 'POST', support, data)).status).toBe(403);
      expect((await request(admin.request, 'POST', support, data)).status).toBe(200);
      expect(state(record)).toBe('DEMO01|DEMO01|02|Y|0|N');
      const resetPage = await useInitialPassword(own, record, 'DEMO01', newPassword);
      const otherAccount = `${auth}/init-pwd-active?userId=${other.userId}`;
      expect((await request(own.request, 'POST', otherAccount, data)).status).toBe(403);
      await changeOwnPassword(resetPage, record);
    });

    await step('USER-01 승격/중복 무변경/다음 요청 권한', async () => {
      const data = { password: newPassword, chkPassword: newPassword };
      expect((await request(admin.request, 'POST', `${auth}/init-pwd?userId=${target.userId}`, data)).status).toBe(200);
      await signIn(own.request, target.userId, 'DEMO01', '02', newPassword, true);
      const path = `/api/system/client-users/${target.sysId}/promote`;
      expect((await request(a.request, 'POST', path)).status).toBe(403);
      expect((await request(own.request, 'GET', `${users}/search`)).status).toBe(403);
      expect((await request(admin.request, 'POST', path)).status).toBe(200);
      const me = await request(own.request, 'GET', `${auth}/me`);
      expect(me.body?.data?.staffRole).toBe('01');
      expect((await request(own.request, 'GET', `${users}/search`)).status).toBe(200);
      const snapshot = () => db(`select user_role, modify_user_id, modify_datetime, xmin from sys_user where sys_id = '${target.sysId}'`);
      const before = snapshot();
      expect(before).toMatch(/^01\|demo_admin\|/);
      expect((await request(admin.request, 'POST', path)).status).toBe(200);
      expect(snapshot()).toBe(before);
      console.log('중복 승격 후 수정자/수정 시각/행 버전 동일');
    });

    await step('SEC-01 타 매장/관리자/스태프 행위자 거부', async () => {
      expect(state(target).split('|')[2]).toBe('01');
      const responses = [
        await request(a.request, 'POST', `${users}/reset_pwd/${other.sysId}`),
        await request(a.request, 'POST', `${users}/reset_pwd/${target.sysId}`),
        await request(staff.request, 'POST', `${users}/reset_pwd/${record.sysId}`),
      ];
      expect(responses.map(({ status }) => status)).toEqual([403, 403, 403]);
    });

    await step('USER-01 계정 전환/별도 세션/새로고침', async () => {
      const separate = await b.newPage();
      await separate.goto(userPage);
      await expect(separate.getByRole('cell', { name: other.userId, exact: true })).toBeVisible();
      await expect(separate.getByRole('cell', { name: record.userId, exact: true })).toHaveCount(0);
      await switchAccount(page, 'autoqa_manager_b');
      await page.goto(userPage);
      for (let round = 0; round < 2; round++) {
        await expect(page.getByRole('cell', { name: other.userId, exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: record.userId, exact: true })).toHaveCount(0);
        if (round === 0) await page.reload();
      }
    });
  } finally {
    try {
      // Restore only fixtures created by this run. The promoted row is no longer deletable via Client.
      if (primary && (await request(a.request, 'GET', `${auth}/me`)).body?.data?.sysPlantCd !== 'DEMO01') {
        await signIn(a.request, 'demo_owner', 'DEMO01', '01');
      }
      if (primary) await step('USER-01 정상 삭제', async () => {
        expect((await request(a.request, 'POST', `${users}/del`, [{ sysId: primary!.sysId }])).status).toBe(200);
        expect(await list(a.request, primary!.userId)).toEqual([]);
        expect(state(primary!).split('|').at(-1)).toBe('Y');
      });
      if (foreign) expect((await request(b.request, 'POST', `${users}/del`, [{ sysId: foreign.sysId }])).status).toBe(200);
    } finally {
      try {
        if (promote) {
          db(`update sys_user set delete_yn = 'Y' where user_id = 'AUTO-QA-auth-promote-${run}' and plant_cd = 'DEMO01'`);
          expect(state(promote).split('|').at(-1)).toBe('Y');
        }
      } finally {
        await Promise.all([a, b, admin, staff, own].map((context) => context.close()));
      }
    }
  }
});

test('다섯 번째 로그인 실패 / 잠금 / 동시 반영', async ({ browser }) => {
  const [first, second] = await Promise.all([1, 2].map(() => browser.newContext({ baseURL, serviceWorkers: 'block' })));
  const count = () => db("select password_fail_cnt from sys_user where user_id = 'demo_lock' and plant_cd = 'ADMIN' and delete_yn = 'N'");
  const reset = () => db("update sys_user set password_fail_cnt = 0 where user_id = 'demo_lock' and plant_cd = 'ADMIN' and delete_yn = 'N'");
  const login = (ctx: BrowserContext, pwd: string) => request(ctx.request, 'POST', `${auth}/login`, { userId: 'demo_lock', userPassword: pwd });
  let started = false;
  try {
    expect(count()).toBe('0');
    started = true;
    await signIn(first.request, 'demo_lock', 'ADMIN', '01');
    await step('AUTH-01 순차 임계값/정상 비밀번호 거부', async () => {
      const wrong = `wrong-${run}`;
      for (let attempt = 1; attempt <= 4; attempt++) {
        const response = await login(second, wrong);
        expect(response).toMatchObject({ status: 401, body: { success: false, data: attempt } });
      }
      const page = await second.newPage();
      const fifth = await browserLogin(page, 'demo_lock', wrong);
      expect(fifth).toMatchObject({ status: 401, body: { success: false, data: 5 } });
      await expect(page.getByRole('dialog', { name: '로그인 제한 안내', exact: true })).toBeVisible();
      console.log(`다섯 번째 실패 DB=${count()}`);
      expect(count()).toBe('5');
      const locked = await login(second, fixturePassword());
      expect(locked).toMatchObject({ status: 401, body: { success: false, data: 5 } });
      expect(locked.body?.message).toMatch(/사용 중지/);
      expect(count()).toBe('5');
      expect((await request(second.request, 'GET', `${auth}/me`)).status).toBe(401);
    });
    await step('AUTH-01 동시 실패 증가 유지', async () => {
      reset();
      const wrong = `wrong-${run}`;
      for (let attempt = 1; attempt <= 3; attempt++) expect((await login(second, wrong)).status).toBe(401);
      expect(count()).toBe('3');
      const results = await Promise.all([login(first, wrong), login(second, wrong)]);
      expect(results.map(({ status }) => status)).toEqual([401, 401]);
      expect(results.map(({ body }) => body.data).sort()).toEqual([4, 5]);
      console.log(`동시 실패 DB=${count()}`);
      expect(count()).toBe('5');
    });
  } finally {
    try {
      if (started) {
        reset();
        console.log(`잠금 계정 복구 DB=${count()}`);
        expect(count()).toBe('0');
      }
    } finally {
      await Promise.all([first.close(), second.close()]);
    }
  }
});
