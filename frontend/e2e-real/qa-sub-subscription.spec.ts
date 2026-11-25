/**
 * 4번 C 구독 자동 승격 실서버 QA. 실행:
 * npx playwright test -c playwright.real.config.ts qa-sub-subscription --max-failures=0
 * 환경: qa-env.ps1(PG*), QA_AUTH_PSQL, QA_AUTH_FIXTURE_PASSWORD. 127.0.0.1:25가 비어 있어야 한다.
 */
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { existsSync, readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:net';
import { isDeepStrictEqual } from 'node:util';
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

const front = 'http://localhost:3000';
const back = 'http://localhost:8080';
const run = randomBytes(3).toString('hex');
const numbers = [1, 2, 3, 4, 5].map((n) => `999000000${n}`);
/** 요금제 API 호출의 메뉴 코드. 감사 로그와 메뉴 열람 로그를 이 값으로 정리한다. */
const qaMenu = 'AUTO-QA-sub';
const openDate = '2020-01-02';
const newPassword = `Qa!1${randomBytes(8).toString('hex')}`;
const numberList = numbers.map((n) => `'${n}'`).join(',');
const stateFile = process.env.QA_SUB_FAKE_STATE ?? 'D:/coding/qr_order-local/billing/fake-pg-state.json';
const backendLog = process.env.QA_SUB_BACKEND_LOG ?? 'D:/coding/qr_order-local/logs/backend.log';

function fixturePassword(): string {
  const value = process.env.QA_AUTH_FIXTURE_PASSWORD;
  if (!value) throw new Error('QA_AUTH_FIXTURE_PASSWORD가 필요합니다.');
  return value;
}

function db(sql: string): string {
  const { PGHOST, PGPORT, PGDATABASE, QA_AUTH_PSQL } = process.env;
  if (PGHOST !== '127.0.0.1' || PGPORT !== '55432' || PGDATABASE !== 'qrdemo' || !QA_AUTH_PSQL) {
    throw new Error('로컬 qrdemo 연결과 QA_AUTH_PSQL이 필요합니다.');
  }
  return execFileSync(QA_AUTH_PSQL, ['-XwAqt', '-v', 'ON_ERROR_STOP=1'], {
    input: Buffer.from(sql), encoding: 'utf8', timeout: 15_000,
    env: { ...process.env, PGCLIENTENCODING: 'UTF8' },
  }).trim();
}

function check(label: string, actual: unknown, expected: unknown) {
  const ok = isDeepStrictEqual(actual, expected);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label} :: ${JSON.stringify(actual)}`);
  expect.soft(actual, label).toEqual(expected);
}

async function call(session: APIRequestContext, method: 'GET' | 'POST', path: string, data?: unknown) {
  const response = await session.fetch(path.startsWith('http') ? path : `${front}${path}`, {
    method, data, maxRedirects: 0, timeout: 15_000,
  });
  const body = await response.json().catch(() => undefined);
  console.log(`HTTP ${method} ${path} -> ${response.status()}`
    + (typeof body?.message === 'string' ? ` "${body.message}"` : ''));
  return { status: response.status(), body };
}

async function session(userId?: string, password = fixturePassword()) {
  const context = await request.newContext({ baseURL: front });
  if (userId) {
    const login = await call(context, 'POST', '/api/auth/login', { userId, userPassword: password });
    expect(login.body?.success, `${userId} 로그인`).toBe(true);
  }
  return context;
}

async function me(context: APIRequestContext) {
  return (await context.get(`${front}/api/auth/me`).then((r) => r.json())).data;
}

// ---- DB ----

type Snap = { sub: string[]; owner: string | null; inv: string[]; evt: string[] };

function plantResources(plant: string) {
  return `select provider_subscription_id from sys_subscription where plant_cd='${plant}'
      and provider_subscription_id is not null
    union select i.provider_invoice_id from sys_subscription_invoice i
      join sys_subscription s on s.sys_id=i.subscription_sys_id where s.plant_cd='${plant}'`;
}

function snap(plant: string, label: string): Snap {
  const value = JSON.parse(db(`select json_build_object(
    'sub', coalesce((select json_agg(status || ' granted=' || role_granted_yn
        || ' revoked=' || case when role_revoked_at is null then 'N' else 'Y' end
        || ' end=' || provider_end_status || ' pm=' || payment_method_status order by insert_datetime, sys_id)
      from sys_subscription where plant_cd='${plant}'), '[]'),
    'owner', (select u.user_role from sys_user u join sys_subscription s on s.owner_user_sys_id=u.sys_id
      where s.plant_cd='${plant}' limit 1),
    'inv', coalesce((select json_agg(i.status || ' refunded=' || i.refunded_amount || ' ' || coalesce(i.apply_result, '-')
        order by s.insert_datetime, i.period_start_at, i.insert_datetime)
      from sys_subscription_invoice i join sys_subscription s on s.sys_id=i.subscription_sys_id
      where s.plant_cd='${plant}'), '[]'),
    'evt', coalesce((select json_agg(event_type || ' ' || result order by received_at, sys_id)
      from sys_billing_webhook_event where resource_id in (${plantResources(plant)})), '[]'))`)) as Snap;
  console.log(`DB[${label}] ${JSON.stringify(value)}`);
  return value;
}

/** 구독/인보이스/사용자/웹훅 행 전체(수정 시각 포함)의 해시. "변화 없음" 증거. */
function fingerprint(plant: string): string {
  return db(`select md5(concat(
    (select string_agg(s::text, ';' order by s.sys_id) from sys_subscription s where plant_cd='${plant}'),
    (select string_agg(i::text, ';' order by i.sys_id) from sys_subscription_invoice i
       join sys_subscription s on s.sys_id=i.subscription_sys_id where s.plant_cd='${plant}'),
    (select string_agg(u::text, ';' order by u.sys_id) from sys_user u where plant_cd='${plant}'),
    (select string_agg(e::text, ';' order by e.sys_id) from sys_billing_webhook_event e
       where resource_id in (${plantResources(plant)}))))`);
}

const eventRows = (webhookId: string) =>
  Number(db(`select count(*) from sys_billing_webhook_event where webhook_id='${webhookId}'`));

/** 가장 새 구독 행의 시각 열을 콘솔 asOf(KST) 문자열로. */
function kst(plant: string, column: 'paid_through_at' | 'grace_until' | 'end_at', shiftSeconds = 0): string {
  return db(`select to_char((${column} + interval '${shiftSeconds} seconds') at time zone 'Asia/Seoul',
      'YYYY-MM-DD"T"HH24:MI:SS.US') from sys_subscription where plant_cd='${plant}'
    order by insert_datetime desc, sys_id desc limit 1`);
}

const column = (plant: string, name: string) =>
  db(`select coalesce(${name}::text, '') from sys_subscription where plant_cd='${plant}'
    order by insert_datetime desc, sys_id desc limit 1`);

/** 이 spec이 만든 행만 지운다(번호 999000000x + AUTO-QA-sub 이름). 플랜/메뉴 시드는 그대로. */
function cleanup(plants: string[] = numbers) {
  const list = plants.map((n) => `'${n}'`).join(',');
  const foreign = db(`select count(*) from sys_plant where plant_cd in (${numberList}) and plant_nm not like 'AUTO-QA-sub%'`);
  if (foreign !== '0') throw new Error('999000000x 번호에 다른 작업의 매장이 있어 정리를 중단합니다.');
  const state = fakeState();
  const subs = Object.values(state.subscriptions).filter((s) => plants.includes(s.plantCd)).map((s) => s.subscriptionId);
  const invoices = Object.values(state.invoices).filter((i) => subs.includes(i.subscriptionId)).map((i) => i.invoiceId);
  const fakeIds = [...subs, ...invoices, '-'].map((id) => `'${id}'`).join(',');
  const users = `select user_id from sys_user where plant_cd in (${list}) and user_id like 'AUTO-QA-sub-%'`;
  db(`begin;
    delete from sys_billing_webhook_event where resource_id in (${fakeIds})
      or resource_id in (select provider_subscription_id from sys_subscription where plant_cd in (${list}))
      or resource_id in (select i.provider_invoice_id from sys_subscription_invoice i
        join sys_subscription s on s.sys_id=i.subscription_sys_id where s.plant_cd in (${list}));
    delete from sys_subscription_invoice where subscription_sys_id in
      (select sys_id from sys_subscription where plant_cd in (${list}));
    delete from sys_subscription where plant_cd in (${list});
    delete from sys_payment p where p.payment_cd like 'AUTO-QA-sub-%'
      and not exists (select 1 from sys_subscription s where s.plan_sys_id=p.sys_id);
    delete from sys_login_log_detail where link_sys_id in
      (select sys_id from sys_login_log_master where user_id in (${users}));
    delete from sys_login_log_master where sys_plant_cd in (${list});
    delete from sys_login_log_detail where menu_cd='${qaMenu}';
    delete from sys_audit_trail where sys_plant_cd in (${list}) or menu_cd='${qaMenu}';
    delete from sys_error_info where sys_plant_cd in (${list});
    delete from sys_email_log where ${plants.map((p) => `email_to like 'auto-qa-sub-${p.slice(-1)}-%'`).join(' or ')};
    delete from sys_user where plant_cd in (${list});
    delete from sys_plant where plant_cd in (${list});
    commit;`);
}

/** QA psql 세션 하나가 잠금을 쥔다. 서버 트랜잭션을 정해진 지점에서 세우는 데만 쓴다. */
async function holdLock(lockSql: string) {
  db('select 1'); // 로컬 DB 확인
  const psql = spawn(process.env.QA_AUTH_PSQL!, ['-XwAqt', '-v', 'ON_ERROR_STOP=1'],
    { env: { ...process.env, PGCLIENTENCODING: 'UTF8' } });
  let output = '';
  psql.stdout.on('data', (chunk) => { output += String(chunk); });
  psql.stderr.on('data', (chunk) => { console.log(`psql ${String(chunk).trim()}`); });
  psql.stdin.write(`set statement_timeout='30s'; set idle_in_transaction_session_timeout='60s';
    begin; ${lockSql}; select 'holder=' || pg_backend_pid();\n`);
  await expect.poll(() => /holder=(\d+)/.test(output), { timeout: 10_000 }).toBe(true);
  let open = true;
  return {
    pid: Number(/holder=(\d+)/.exec(output)![1]),
    /** lastSql은 잠금을 풀기 직전 같은 트랜잭션에서 실행한다. */
    async release(lastSql = '') {
      if (!open) return;
      open = false;
      const closed = once(psql, 'close');
      psql.stdin.end(`${lastSql}\ncommit;\n`);
      expect((await closed)[0], 'psql 종료 코드').toBe(0);
    },
  };
}

/** holder 때문에 대기 중이고 SQL이 pattern에 맞는 백엔드가 생길 때까지 기다려 pid를 돌려준다. */
async function waitBlocked(holder: number, pattern: RegExp, label: string) {
  let found: { pid: number; query: string } | undefined;
  await expect.poll(() => {
    const waiting = JSON.parse(db(`select coalesce(json_agg(json_build_object('pid', pid, 'query',
        regexp_replace(query, '\\s+', ' ', 'g'))), '[]')
      from pg_stat_activity where ${holder} = any(pg_blocking_pids(pid))`)) as { pid: number; query: string }[];
    found = waiting.find((w) => pattern.test(w.query));
    return found !== undefined;
  }, { message: label, timeout: 10_000 }).toBe(true);
  console.log(`잠금 대기[${label}] pid=${found!.pid} <- ${holder} :: ${pattern.exec(found!.query)![0].slice(-120)}`);
  return found!.pid;
}

// ---- 가짜 PG ----

type FakeState = {
  webhooksEnabled: boolean;
  lookupFailuresRemaining: number;
  subscriptions: Record<string, { subscriptionId: string; plantCd: string; status: string; paymentMethodStatus: string }>;
  invoices: Record<string, { invoiceId: string; subscriptionId: string; status: string; periodStartAt: string }>;
  deliveries: { webhookId: string; type: string; body: string; lastStatus: number; sendCount: number }[];
};

function fakeState(): FakeState {
  if (!existsSync(stateFile)) {
    return { webhooksEnabled: true, lookupFailuresRemaining: 0, subscriptions: {}, invoices: {}, deliveries: [] };
  }
  return JSON.parse(readFileSync(stateFile, 'utf8')) as FakeState;
}

const providerSub = (plant: string) => column(plant, 'provider_subscription_id');

function delivery(subscriptionId: string, type: string) {
  const found = fakeState().deliveries.filter((d) =>
    d.type === type && JSON.parse(d.body).data.subscriptionId === subscriptionId).at(-1);
  if (!found) throw new Error(`웹훅 없음: ${type} ${subscriptionId}`);
  return found;
}

async function fakeConsole(context: APIRequestContext, action: string, form: Record<string, string> = {}) {
  const response = await context.post(`${back}/fake-pg/console/${action}`, { form, maxRedirects: 0 });
  console.log(`HTTP POST /fake-pg/console/${action} ${JSON.stringify(form)} -> ${response.status()}`);
  expect(response.status(), action).toBe(303);
}

async function batch(context: APIRequestContext, asOf: string) {
  await fakeConsole(context, 'batch', { asOf });
  const html = await context.get(`${back}/fake-pg/console`).then((r) => r.text());
  console.log(`배치 ${/마지막 실행: ([^<]*)</.exec(html)?.[1]}`);
}

const rejectedLines = () =>
  readFileSync(backendLog, 'utf8').split('\n').filter((line) => line.includes('billing webhook rejected'));

async function startCheckout(owner: APIRequestContext) {
  const view = await call(owner, 'GET', '/api/client/subscription');
  const result = await call(owner, 'POST', '/api/client/subscription/checkout', { planSysId: view.body.plans[0].planSysId });
  const url: string | undefined = result.body?.launch?.redirectUrl;
  return { status: result.status, token: url ? new URL(url).searchParams.get('token')! : '' };
}

async function payFake(owner: APIRequestContext, token: string, scenario = 'SUCCESS') {
  const response = await owner.post(`${back}/fake-pg/checkout`, { form: { token, scenario }, maxRedirects: 0 });
  console.log(`HTTP POST /fake-pg/checkout ${scenario} -> ${response.status()}`);
  return response.status();
}

// ---- 가입 + 로컬 SMTP 수신기 ----

const mailbox = new Map<string, string>();

/** 로컬 스택의 메일 서버(localhost:25)를 대신하는 QA 수신기. 인증 코드만 기억하고 밖으로 보내지 않는다. */
async function startMailSink(): Promise<Server> {
  const server = createServer((socket) => {
    let buffer = '';
    let data = false;
    let to = '';
    socket.write('220 auto-qa-sub\r\n');
    socket.on('error', () => undefined);
    socket.on('data', (chunk) => {
      buffer += chunk.toString('latin1');
      for (;;) {
        const end = buffer.indexOf(data ? '\r\n.\r\n' : '\r\n');
        if (end < 0) return;
        const part = buffer.slice(0, end);
        buffer = buffer.slice(end + (data ? 5 : 2));
        if (data) {
          const split = part.indexOf('\r\n\r\n');
          const head = part.slice(0, split);
          let body = part.slice(split + 4);
          if (/base64/i.test(head)) body = Buffer.from(body, 'base64').toString('utf8');
          else {
            body = Buffer.from(body.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/g,
              (_, hex: string) => String.fromCharCode(parseInt(hex, 16))), 'latin1').toString('utf8');
          }
          const code = /인증 코드: ([A-Z0-9]{6})/.exec(body)?.[1];
          if (code) mailbox.set(to, code);
          data = false;
          socket.write('250 ok\r\n');
          continue;
        }
        if (/^RCPT TO:/i.test(part)) to = /<([^>]+)>/.exec(part)?.[1] ?? '';
        if (/^DATA/i.test(part)) { data = true; socket.write('354 go\r\n'); }
        else if (/^QUIT/i.test(part)) socket.end('221 bye\r\n');
        else socket.write('250 ok\r\n');
      }
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(25, '127.0.0.1', resolve);
  });
  return server;
}

function mailCode(email: string) {
  const code = mailbox.get(email);
  if (!code) throw new Error('인증 메일을 받지 못했습니다.');
  return code;
}

function owner(n: number) {
  const number = numbers[n - 1];
  return {
    number, userId: `AUTO-QA-sub-o${n}-${run}`, name: `AUTO-QA-sub${n}`,
    email: `auto-qa-sub-${n}-${run}@example.invalid`, plantNm: `AUTO-QA-sub${n}컴퍼니`,
  };
}

type Owner = ReturnType<typeof owner>;

async function signupByApi(context: APIRequestContext, who: Owner, options: { verify?: string | null } = {}) {
  const verify = options.verify === undefined ? who.number : options.verify;
  if (verify) {
    await call(context, 'POST', '/api/auth/signup/new/chkBRN',
      { businessRegiNum: verify, userNm: who.name, businessRegiDate: openDate });
  }
  await call(context, 'POST', '/api/auth/email_valid/new_user/send', { email: who.email });
  return call(context, 'POST', '/api/auth/signup/new', {
    businessRegiNum: who.number, userNm: who.name, businessRegiDate: openDate, userId: who.userId,
    password: newPassword, passwordChk: newPassword, email: who.email, validCode: mailCode(who.email),
  });
}

function insertStaff(who: Owner) {
  const tag = who.number.slice(-1);
  const userId = `AUTO-QA-sub-staff${tag}-${run}`;
  db(`insert into sys_user (sys_id, user_id, user_nm, user_password, insert_user_id, insert_datetime,
      password_fail_cnt, init_yn, plant_cd, delete_yn, user_role, email_valid_yn)
    select '01AUTOQASUBSTAFF${run.toUpperCase()}000${tag}', '${userId}', 'AUTO-QA-sub staff', user_password,
      'AUTO-QA-sub', now(), 0, 'N', '${who.number}', 'N', '02', 'Y'
    from sys_user where user_id='autoqa_staff_a'`);
  return userId;
}

// ---- 시나리오 ----

/** 가짜 PG 상태는 실행 사이에 남으므로 이번 시나리오의 첫 등록(since)부터만 센다. ID는 순번이라 문자열 비교가 된다. */
const registrations = (plant: string, since: string) => Object.values(fakeState().subscriptions)
  .filter((s) => s.plantCd === plant && s.subscriptionId >= since);
const providerPaid = (plant: string, since: string) => {
  const ids = new Set(registrations(plant, since).map((s) => s.subscriptionId));
  return Object.values(fakeState().invoices).filter((i) => ids.has(i.subscriptionId) && i.status === 'PAID').length;
};
/** 가짜 PG의 ID(sub_/msg_/inv_)는 하나의 순번을 함께 쓰므로 발급 순서를 비교할 수 있다. */
const sequence = (id: string) => Number(id.split('_')[1]);
const eventResult = (webhookId: string) =>
  db(`select coalesce(string_agg(result, ','), '') from sys_billing_webhook_event where webhook_id='${webhookId}'`);

const api = '/api/client/subscription';
const menuRead = '/api/client/menu_manage/menu/master/search';
const userRead = '/api/client/store_manage/user_manage/user/search';
const admin = '/api/system/subscriptions';
const banner = '구독 결제 후 메뉴/직원 관리가 열립니다.';
const cardBanner = '등록된 카드가 만료되었습니다. 다음 결제 전에 결제수단을 확인해 주세요.';
let mail: Server;

test.use({ baseURL: front });
test.beforeAll(async () => {
  cleanup();
  mail = await startMailSink();
});
test.afterAll(async () => {
  const context = await session();
  await fakeConsole(context, 'webhooks', { enabled: 'true' });
  await fakeConsole(context, 'lookup-failures', { count: '0' });
  await context.dispose();
  mail.close();
  if (process.env.QA_SUB_KEEP !== '1') cleanup();
});

async function clientLogin(page: Page, userId: string, password: string) {
  await page.goto('/client/login');
  await page.getByLabel('아이디', { exact: true }).fill(userId);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/client\/main$/);
}

async function signupInBrowser(page: Page, who: Owner) {
  const confirm = () => page.getByRole('dialog').getByRole('button', { name: '확인' }).click();
  const status = async (path: string, action: () => Promise<void>) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => new URL(r.url()).pathname === path), action(),
    ]);
    console.log(`브라우저 ${path} -> ${response.status()}`);
    return response.status();
  };
  await page.goto('/client/login');
  await page.getByRole('button', { name: '회원가입' }).click();
  await page.getByText('개인정보 수집·이용에 동의합니다 (필수)').click();
  await page.getByRole('button', { name: '동의 후 계속' }).click();
  await page.locator('#biz-no').fill(who.number);
  await page.locator('#biz-rep-name').fill(who.name);
  await page.locator('#biz-open-date').fill(openDate);
  check('1 브라우저 사업자 인증', await status('/api/auth/signup/new/chkBRN',
    () => page.getByRole('button', { name: '인증하기' }).click()), 200);
  await confirm();
  await page.locator('#signup-id').fill(who.userId);
  await page.getByRole('button', { name: '중복확인' }).click();
  await expect(page.getByText('사용 가능한 아이디입니다.')).toBeVisible();
  await page.locator('#signup-pw').fill(newPassword);
  await page.locator('#signup-pw-confirm').fill(newPassword);
  await page.locator('#signup-email').fill(who.email);
  await status('/api/auth/email_valid/new_user/send',
    () => page.getByRole('button', { name: '인증', exact: true }).click());
  await page.locator('#signup-email-code').fill(mailCode(who.email));
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.getByText('이메일 인증이 완료되었습니다.')).toBeVisible();
  check('1 브라우저 가입', await status('/api/auth/signup/new',
    () => page.getByRole('button', { name: '가입하기' }).click()), 200);
  await confirm();
}

/** 구독 화면의 결제 버튼 → 가짜 결제창 → 카드 성공 → 결과 화면. */
async function payInBrowser(page: Page, button: string) {
  await page.goto('/client/subscription');
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect(page).toHaveURL(/\/fake-pg\/checkout\?token=/);
  await page.getByRole('button', { name: '카드 결제 성공' }).click();
  await expect(page.getByRole('heading', { name: '결제 완료' })).toBeVisible();
  await page.getByRole('link', { name: '결과 화면으로 돌아가기' }).click();
  await expect(page).toHaveURL(/\/client\/subscription\/result$/);
}

test('1 / 2 / 3 / 8 / 5 / 6 대표 흐름', async ({ page }) => {
  test.setTimeout(600_000);
  const who = owner(1);
  const plant = who.number;
  const logins: string[] = [];
  page.on('request', (r) => { if (new URL(r.url()).pathname === '/api/auth/login') logins.push(r.url()); });

  console.log('== 1 가입 -> 02 + PENDING');
  check('1 가입 전 DB', snap(plant, '1 전'), { sub: [], owner: null, inv: [], evt: [] });
  await signupInBrowser(page, who);
  check('1 가입 후 DB', snap(plant, '1 후'),
    { sub: ['PENDING granted=N revoked=N end=NONE pm=NONE'], owner: '02', inv: [], evt: [] });
  check('1 매장 행', db(`select plant_nm || '|' || use_yn || '|' || delete_yn from sys_plant where plant_cd='${plant}'`),
    `${who.plantNm}|Y|N`);
  await clientLogin(page, who.userId, newPassword);
  await expect(page.getByText(banner)).toBeVisible();
  check('1 02 배너', await page.getByText(banner).count(), 1);
  const side = page.getByRole('navigation', { name: '사이드 메뉴' });
  await page.goto('/client/menu/info/management');
  await expect(page).toHaveURL(/\/client\/main$/);
  check('1 메뉴 관리 직접 URL -> main', new URL(page.url()).pathname, '/client/main');
  check('1 메뉴 관리 링크 숨김', await page.getByRole('button', { name: '메뉴 관리', exact: true }).count(), 0);
  check('1 메뉴 API', (await call(page.request, 'GET', menuRead)).status, 403);
  check('1 직원 API', (await call(page.request, 'GET', userRead)).status, 403);
  await page.goto('/client/subscription');
  const card = page.getByRole('region', { name: '구독 정보' });
  await expect(card.getByText('결제 전', { exact: true })).toBeVisible();
  check('1 화면 상태 결제 전', await card.getByText('결제 전', { exact: true }).count(), 1);
  const pending = (await call(page.request, 'GET', api)).body;
  check('1 API PENDING', [pending.status, pending.owner, pending.canCheckout, pending.roleGranted],
    ['PENDING', true, true, false]);

  console.log('== 2 결제 -> 재확인 -> ACTIVE (웹훅 끔: 재확인만으로 반영)');
  await fakeConsole(page.request, 'webhooks', { enabled: 'false' });
  await payInBrowser(page, '결제하기');
  check('2 재확인 전 DB 그대로', snap(plant, '2 결제 후 재확인 전'),
    { sub: ['PENDING granted=N revoked=N end=NONE pm=NONE'], owner: '02', inv: [], evt: [] });
  const [reconciled] = await Promise.all([
    page.waitForResponse((r) => new URL(r.url()).pathname === `${api}/reconcile`),
    page.getByRole('button', { name: '결제 결과 재확인' }).click(),
  ]);
  check('2 재확인 HTTP', reconciled.status(), 200);
  await expect(page.getByText('결제가 확인되었습니다.')).toBeVisible();
  await expect(page.getByText(banner)).toHaveCount(0);
  check('2 재확인 후 DB', snap(plant, '2 재확인 후'),
    { sub: ['ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE'], owner: '01', inv: ['PAID refunded=0 APPLIED'], evt: [] });
  check('2 재확인 10초 안 두번째', (await call(page.request, 'POST', `${api}/reconcile`)).status, 429);
  await page.goto('/client/menu/info/management');
  await expect(page.getByRole('region', { name: '메뉴 관리', exact: true })).toBeVisible();
  check('2 메뉴 관리 열림(URL)', new URL(page.url()).pathname, '/client/menu/info/management');
  check('2 사이드 메뉴 관리 노출', await side.getByRole('button', { name: '메뉴 관리', exact: true }).count(), 1);
  check('2 메뉴 API', (await call(page.request, 'GET', menuRead)).status, 200);
  check('2 직원 API', (await call(page.request, 'GET', userRead)).status, 200);
  check('2 재로그인 없음(로그인 요청 총 1회)', logins.length, 1);
  await fakeConsole(page.request, 'webhooks', { enabled: 'true' });
  const sub = providerSub(plant);
  await fakeConsole(page.request, 'resend', { webhookId: delivery(sub, 'Invoice.Paid').webhookId });
  check('2 늦은 Paid 웹훅', delivery(sub, 'Invoice.Paid').lastStatus, 200);
  check('2 늦은 Paid 뒤 DB', snap(plant, '2 늦은 웹훅'), {
    sub: ['ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE'], owner: '01',
    inv: ['PAID refunded=0 APPLIED'], evt: ['Invoice.Paid PROCESSED'],
  });

  console.log('== 3 재가입 / 미인증 / 직원 / 타 매장');
  const before = fingerprint(plant);
  const counts = () => db(`select (select count(*) from sys_plant) || '/' || (select count(*) from sys_user)
    || '/' || (select count(*) from sys_subscription)`);
  const countsBefore = counts();
  const again = await session();
  const dup = await signupByApi(again, { ...who, userId: `${who.userId}-dup` });
  check('3 같은 번호 재가입', dup.status, 409);
  const fifth = owner(5);
  check('3 인증 없는 가입', (await signupByApi(await session(), fifth, { verify: null })).status, 400);
  check('3 다른 번호로 인증 후 가입', (await signupByApi(await session(), fifth, { verify: numbers[3] })).status, 400);
  const unlisted = await call(await session(), 'POST', '/api/auth/signup/new/chkBRN',
    { businessRegiNum: '1234567890', userNm: fifth.name, businessRegiDate: openDate });
  check('3 목록 밖 번호 인증', unlisted.status, 400);
  check('3 매장/사용자/구독 행 수 변화 없음', counts(), countsBefore);
  check('3 번호 5 행 0', snap(fifth.number, '3 번호5').sub, []);
  const staffId = insertStaff(who);
  const staffBase = fingerprint(plant);
  const staff = await session(staffId);
  const view = await call(staff, 'GET', api);
  check('3 직원 조회', [view.status, view.body.owner, view.body.canCheckout, view.body.canCancel],
    [200, false, false, false]);
  const planSysId = pending.plans[0].planSysId;
  check('3 직원 결제', (await call(staff, 'POST', `${api}/checkout`, { planSysId })).status, 403);
  check('3 직원 해지', (await call(staff, 'POST', `${api}/cancel`)).status, 403);
  check('3 직원 재확인', (await call(staff, 'POST', `${api}/reconcile`)).status, 403);
  check('3 직원 이력', (await call(staff, 'GET', `${api}/invoices`)).status, 403);
  check('3 직원 Admin 목록', (await call(staff, 'GET', admin)).status, 403);
  check('3 직원 요청 뒤 DB 변화 없음', fingerprint(plant), staffBase);
  const other = await session('autoqa_manager_b');
  check('3 타 매장 조회', (await call(other, 'GET', api)).body?.hasSubscription, false);
  check('3 타 매장 결제', (await call(other, 'POST', `${api}/checkout`, { planSysId })).status, 404);
  check('3 타 매장 해지', (await call(other, 'POST', `${api}/cancel`)).status, 404);
  check('3 타 매장 재확인', (await call(other, 'POST', `${api}/reconcile`)).status, 404);
  check('3 타 매장 이력', (await call(other, 'GET', `${api}/invoices`)).status, 404);
  const subId = column(plant, 'sys_id');
  check('3 타 매장 Admin 상세', (await call(other, 'GET', `${admin}/${subId}`)).status, 403);
  check('3 대표 Admin 종료', (await call(page.request, 'POST', `${admin}/${subId}/end`)).status, 403);
  check('3 비로그인 조회', (await call(await session(), 'GET', api)).status, 401);
  check('3 타 매장 요청 뒤 DB 변화 없음(직원 추가분 제외)', fingerprint(plant), staffBase);
  console.log(`직원 추가 전 해시 ${before}`);

  console.log('== 8 카드 만료 -> 배너');
  await page.goto(`${back}/fake-pg/console`);
  await page.getByRole('row').filter({ hasText: sub }).filter({ has: page.getByRole('button', { name: '카드 만료' }) })
    .getByRole('button', { name: '카드 만료' }).click();
  check('8 콘솔 웹훅', delivery(sub, 'Customer.PaymentMethodRevoked').lastStatus, 200);
  check('8 DB', snap(plant, '8 카드 만료').sub, ['ACTIVE granted=Y revoked=N end=NONE pm=EXPIRED']);
  await page.goto('/client/main');
  await expect(page.getByText(cardBanner)).toBeVisible();
  check('8 대표 배너', await page.getByText(cardBanner).count(), 1);
  const staffPage = await page.context().browser()!.newPage({ baseURL: front });
  await clientLogin(staffPage, staffId, process.env.QA_AUTH_FIXTURE_PASSWORD!);
  await expect(staffPage.getByText(cardBanner)).toBeVisible();
  check('8 직원 배너', await staffPage.getByText(cardBanner).count(), 1);
  await staffPage.close();

  console.log('== 5 갱신 실패 -> 유예 -> 만료');
  const paidThrough = column(plant, 'paid_through_at');
  await fakeConsole(page.request, 'next-period', { subscriptionId: sub, success: 'false' });
  check('5 실패 웹훅', delivery(sub, 'Invoice.PaymentFailed').lastStatus, 200);
  check('5 PAST_DUE DB', snap(plant, '5 실패'), {
    sub: ['PAST_DUE granted=Y revoked=N end=NONE pm=EXPIRED'], owner: '01',
    inv: ['PAID refunded=0 APPLIED', 'FAILED refunded=0 -'],
    evt: ['Invoice.Paid PROCESSED', 'Customer.PaymentMethodRevoked PROCESSED', 'Invoice.PaymentFailed PROCESSED'],
  });
  check('5 유예 = 기간 끝 + 7일', db(`select (grace_until - paid_through_at = interval '7 days')::text
    from sys_subscription where sys_id='${subId}'`), 'true');
  check('5 기간 끝 그대로', column(plant, 'paid_through_at'), paidThrough);
  check('5 유예 중 메뉴 API', (await call(page.request, 'GET', menuRead)).status, 200);
  await page.goto('/client/subscription');
  await expect(card.getByText('결제 실패(유예 중)', { exact: true })).toBeVisible();
  check('5 유예 화면 버튼', await page.getByRole('button', { name: '결제수단 다시 등록' }).count(), 1);
  await batch(page.request, kst(plant, 'grace_until', -1));
  check('5 유예 끝 1초 전 배치', [snap(plant, '5 grace-1s').sub[0], (await me(page.request)).staffRole],
    ['PAST_DUE granted=Y revoked=N end=NONE pm=EXPIRED', '01']);
  await batch(page.request, kst(plant, 'grace_until'));
  const expired = snap(plant, '5 grace 도달');
  check('5 유예 도달 -> EXPIRED / 02 / 종료', [expired.sub, expired.owner],
    [['EXPIRED granted=Y revoked=Y end=DONE pm=EXPIRED'], '02']);
  check('5 제공자 구독 종료', fakeState().subscriptions[sub].status, 'ENDED');
  check('5 만료 뒤 메뉴 API', (await call(page.request, 'GET', menuRead)).status, 403);
  check('5 종료 웹훅', delivery(sub, 'Subscription.Ended').lastStatus, 200);

  console.log('== 6 재구독 -> 해지 예약 -> AFTER_CANCEL -> 만료');
  await payInBrowser(page, '다시 구독');
  const second = providerSub(plant);
  check('6 재구독 DB', snap(plant, '6 재구독').sub, [
    'EXPIRED granted=Y revoked=Y end=DONE pm=EXPIRED', 'ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE']);
  check('6 새 제공자 구독', second !== sub && second.startsWith('sub_'), true);
  await page.goto('/client/subscription');
  await expect(page.getByText(cardBanner)).toHaveCount(0);
  await page.getByRole('button', { name: '해지 예약', exact: true }).click();
  const [cancelled] = await Promise.all([
    page.waitForResponse((r) => new URL(r.url()).pathname === `${api}/cancel`),
    page.getByRole('dialog').getByRole('button', { name: '해지 예약', exact: true }).click(),
  ]);
  check('6 해지 HTTP', cancelled.status(), 200);
  await expect(card.getByText('해지 예약', { exact: true }).first()).toBeVisible();
  check('6 end_at = paid_through_at', column(plant, 'end_at') === column(plant, 'paid_through_at'), true);
  const endAt = column(plant, 'end_at');
  check('6 해지 뒤 DB', [snap(plant, '6 해지').sub[1], (await me(page.request)).staffRole],
    ['CANCEL_SCHEDULED granted=Y revoked=N end=NONE pm=ACTIVE', '01']);
  check('6 해지 재요청', (await call(page.request, 'POST', `${api}/cancel`)).status, 200);
  check('6 해지 뒤 결제 시작', (await call(page.request, 'POST', `${api}/checkout`, { planSysId })).status, 409);
  await fakeConsole(page.request, 'next-period', { subscriptionId: second, success: 'true' });
  check('6 해지 뒤 Paid 웹훅', delivery(second, 'Invoice.Paid').lastStatus, 200);
  const after = snap(plant, '6 AFTER_CANCEL');
  check('6 AFTER_CANCEL', after.inv.slice(2), ['PAID refunded=0 APPLIED', 'PAID refunded=0 AFTER_CANCEL']);
  check('6 end_at / paid_through 불변', [column(plant, 'end_at'), column(plant, 'paid_through_at')], [endAt, endAt]);
  const boss = await session('demo_admin');
  const problems = await call(boss, 'GET', `${admin}?problemOnly=true`);
  check('6 Admin 문제 건', problems.body.rows.filter((r: { plantCd: string }) => r.plantCd === plant)
    .map((r: { status: string; problemCount: number }) => [r.status, r.problemCount]), [['CANCEL_SCHEDULED', 1]]);
  await batch(page.request, kst(plant, 'end_at', -1));
  check('6 end_at 1초 전', [snap(plant, '6 end-1s').sub[1], (await me(page.request)).staffRole],
    ['CANCEL_SCHEDULED granted=Y revoked=N end=NONE pm=ACTIVE', '01']);
  await batch(page.request, kst(plant, 'end_at'));
  const final = snap(plant, '6 end_at 도달');
  check('6 end_at 도달 -> EXPIRED / 02', [final.sub[1], final.owner],
    ['EXPIRED granted=Y revoked=Y end=DONE pm=ACTIVE', '02']);
  check('6 제공자 종료', fakeState().subscriptions[second].status, 'ENDED');
});

test('4 웹훅 재전송 / 위조 / 금액 불일치 / 조회 실패', async ({ page }) => {
  test.setTimeout(300_000);
  const who = owner(2);
  const plant = who.number;
  const guest = await session();
  check('4 가입', (await signupByApi(guest, who)).status, 200);
  const user = await session(who.userId, newPassword);
  const boss = await session('demo_admin');
  const pendingRow = 'PENDING granted=N revoked=N end=NONE pm=NONE';

  console.log('== 4a 금액 불일치: 구독 스냅샷 금액을 DB에서 +1000 (콘솔에는 금액 변경 버튼 없음)');
  const first = await startCheckout(user);
  check('4a 결제 시작', first.status, 200);
  db(`update sys_subscription set amount = amount + 1000 where plant_cd='${plant}'`);
  const sub = providerSub(plant);
  check('4a 가짜 결제', await payFake(user, first.token), 200);
  check('4a 웹훅', delivery(sub, 'Invoice.Paid').lastStatus, 200);
  check('4a MISMATCH / 승격 없음', snap(plant, '4a'), {
    sub: [pendingRow], owner: '02', inv: ['PAID refunded=0 MISMATCH'], evt: ['Invoice.Paid PROCESSED'],
  });
  check('4a 메뉴 API', (await call(user, 'GET', menuRead)).status, 403);
  const problems = await call(boss, 'GET', `${admin}?problemOnly=true`);
  check('4a Admin 문제 건', problems.body.rows.filter((r: { plantCd: string }) => r.plantCd === plant).length, 1);
  await call(user, 'POST', `${api}/reconcile`);
  check('4a 재확인해도 승격 없음', [snap(plant, '4a 재확인').owner, column(plant, 'status')], ['02', 'PENDING']);

  console.log('== 4a-2 추가 관찰: 불일치 뒤 대표가 다시 결제하면');
  const retry = await startCheckout(user);
  check('4a-2 열린 시도 안 재결제', retry.status, 409);
  db(`update sys_subscription set checkout_expires_at = now() - interval '1 minute' where plant_cd='${plant}'`);
  const renewed = await startCheckout(user);
  check('4a-2 시도 만료 뒤 새 결제 시작', renewed.status, 200);
  const fresh = providerSub(plant);
  check('4a-2 새 제공자 구독', fresh !== sub, true);
  check('4a-2 [B2 / 정책 §6] 옛 유료 등록 종료됨', fakeState().subscriptions[sub].status, 'ENDED');
  check('4a-2 [B2] 종료가 새 등록보다 먼저(순번)',
    sequence(delivery(sub, 'Subscription.Ended').webhookId) < sequence(fresh), true);
  check('4a-2 [B2] 제공자 등록 상태(옛 / 새)', registrations(plant, sub).map((s) => s.status), ['ENDED', 'INCOMPLETE']);

  console.log('== 4b 웹훅 끄고 결제 -> 위조 -> 조회 실패 503 -> 재전송');
  await fakeConsole(user, 'webhooks', { enabled: 'false' });
  check('4b 가짜 결제', await payFake(user, renewed.token), 200);
  const paid = delivery(fresh, 'Invoice.Paid');
  const base = fingerprint(plant);
  check('4b 미전송', [paid.lastStatus, eventRows(paid.webhookId)], [0, 0]);
  const rejectedBefore = rejectedLines().length;
  const now = String(Math.floor(Date.now() / 1000));
  const forged = await guest.post(`${back}/api/billing/webhook/fake`, {
    headers: {
      'webhook-id': paid.webhookId, 'webhook-timestamp': now,
      'webhook-signature': `v1,${Buffer.alloc(32).toString('base64')}`, 'content-type': 'application/json',
    },
    data: Buffer.from(paid.body),
  });
  check('4b 위조(직접 POST) 서명 틀림', forged.status(), 401);
  const bare = await guest.post(`${back}/api/billing/webhook/fake`, { data: Buffer.from(paid.body) });
  check('4b 헤더 없음', bare.status(), 401);
  await fakeConsole(user, 'forge', { webhookId: paid.webhookId, mode: 'BAD_SIGNATURE' });
  await fakeConsole(user, 'forge', { webhookId: paid.webhookId, mode: 'STALE_TIMESTAMP' });
  // bootRun 로그 파일은 늦게 써지므로 4줄이 보일 때까지 기다린다.
  await expect.poll(() => rejectedLines().length - rejectedBefore, { timeout: 15_000 }).toBeGreaterThanOrEqual(4);
  const reasons = rejectedLines().slice(rejectedBefore).map((l) => /reason=(\w+)/.exec(l)?.[1]);
  check('4b 백엔드 거절 사유', reasons,
    ['SIGNATURE_MISMATCH', 'MISSING_HEADER', 'SIGNATURE_MISMATCH', 'TIMESTAMP_OUT_OF_TOLERANCE']);
  check('4b 위조 뒤 이벤트 0행 / DB 변화 없음', [eventRows(paid.webhookId), fingerprint(plant)], [0, base]);
  await fakeConsole(user, 'webhooks', { enabled: 'true' });
  await fakeConsole(user, 'lookup-failures', { count: '1' });
  await fakeConsole(user, 'resend', { webhookId: paid.webhookId });
  check('4b 조회 실패 -> 503', delivery(fresh, 'Invoice.Paid').lastStatus, 503);
  check('4b 503 뒤 0행 / DB 변화 없음', [eventRows(paid.webhookId), fingerprint(plant)], [0, base]);
  await fakeConsole(user, 'resend', { webhookId: paid.webhookId });
  check('4b 재전송 -> 200', delivery(fresh, 'Invoice.Paid').lastStatus, 200);
  const ok = snap(plant, '4b 재전송 성공');
  check('4b ACTIVE / 01', [ok.sub, ok.owner, eventRows(paid.webhookId)],
    [['ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE'], '01', 1]);

  console.log('== 4c 같은 webhook-id 재전송');
  const done = fingerprint(plant);
  await fakeConsole(user, 'resend', { webhookId: paid.webhookId });
  check('4c 재전송 200', delivery(fresh, 'Invoice.Paid').lastStatus, 200);
  check('4c DB 변화 없음', [eventRows(paid.webhookId), fingerprint(plant)], [1, done]);
  await fakeConsole(user, 'forge', { webhookId: paid.webhookId, mode: 'BAD_SIGNATURE' });
  check('4c 처리된 ID 위조도 변화 없음', fingerprint(plant), done);

  console.log('== B2 이어서: 연결 끊긴 ACTIVE 등록의 다음 회차 (연결은 DB에서 잠시 끊는다)');
  // 수정 뒤에는 교체 전에 옛 등록이 ENDED라 가짜 PG가 청구하지 않는다. 연결이 끊긴 ACTIVE 등록은 DB로 만든다.
  const subId = column(plant, 'sys_id');
  const problemCount = async () => (await call(boss, 'GET', `${admin}?problemOnly=true`)).body.rows
    .filter((r: { plantCd: string }) => r.plantCd === plant)
    .map((r: { problemCount: number }) => r.problemCount);
  const state = () => db(`select concat_ws('|', status, paid_through_at, grace_until, end_at, role_granted_yn)
    from sys_subscription where sys_id='${subId}'`);
  check('B2 청구 전 Admin 문제 건(옛 불일치 1)', await problemCount(), [1]);
  const linkedState = state();
  const link = (id: string) =>
    db(`update sys_subscription set provider_subscription_id='${id}' where sys_id='${subId}'`);
  let orphanInvoice = '';
  link(`sub_autoqa_unlinked_${run}`);
  try {
    await fakeConsole(user, 'next-period', { subscriptionId: fresh, success: 'true' });
    const orphan = delivery(fresh, 'Invoice.Paid');
    orphanInvoice = JSON.parse(orphan.body).data.invoiceId as string;
    check('B2 연결 끊긴 청구: 웹훅 / 이벤트', [orphan.lastStatus, eventResult(orphan.webhookId)], [200, 'MISMATCH']);
    check('B2 연결 끊긴 청구: 이 구독의 인보이스 행', db(`select concat_ws('|', status, apply_result, subscription_sys_id='${
      subId}') from sys_subscription_invoice where provider_invoice_id='${orphanInvoice}'`), 'PAID|MISMATCH|t');
    check('B2 구독 상태/기간/권한 불변', [state(), db(`select user_role from sys_user where user_id='${who.userId}'`)],
      [linkedState, '01']);
  } finally {
    link(fresh);
  }
  check('B2 Admin 문제 건 2', await problemCount(), [2]);
  const listed = await call(boss, 'GET', admin);
  check('B2 Admin 불일치 웹훅 목록에 표시', listed.body.mismatchEvents
    .some((e: { resourceId: string }) => e.resourceId === orphanInvoice), true);

  await page.goto('/admin/login');
  await page.getByLabel('아이디', { exact: true }).fill('demo_admin');
  await page.getByLabel('비밀번호', { exact: true }).fill(fixturePassword());
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/main$/);
  await page.goto('/admin/subscriptions');
  const listRow = page.getByRole('table', { name: '구독 목록' }).getByRole('row').filter({ hasText: who.plantNm });
  await expect(listRow).toBeVisible();
  check('B2 화면 목록 문제 건 칸', await listRow.getByRole('cell').last().innerText(), '2');
  await listRow.getByRole('button', { name: who.plantNm }).click();
  const problemRow = page.getByRole('table', { name: '인보이스' }).getByRole('row').filter({ hasText: orphanInvoice });
  await expect(problemRow).toBeVisible();
  check('B2 화면 상세 문제 행', (await problemRow.innerText()).includes('문제:'), true);
  console.log(`OBS 화면 문제 행: ${(await problemRow.innerText()).replace(/\s+/g, ' ')}`);

  console.log('== B2 이어서: 종료된 옛 등록에서 온 알림(Admin 환불, DB 조작 없음)');
  const oldInvoice = (await call(boss, 'GET', `${admin}/${subId}`)).body.invoices
    .find((i: { providerInvoiceId: string }) =>
      fakeState().invoices[i.providerInvoiceId]?.subscriptionId === sub);
  check('B2 옛 등록의 문제 인보이스', [oldInvoice?.applyResult, oldInvoice?.problem], ['MISMATCH', true]);
  const beforeRefund = state();
  const refunded = await call(boss, 'POST', `${admin}/${subId}/refund`,
    { invoiceSysId: oldInvoice?.invoiceSysId, amount: oldInvoice?.refundable });
  check('B2 옛 등록 환불 HTTP', refunded.status, 200);
  const refundHook = delivery(sub, 'Invoice.PaymentRefunded');
  check('B2 옛 등록 환불 알림: 웹훅 / 이벤트(IGNORED 아님)',
    [refundHook.lastStatus, eventResult(refundHook.webhookId)], [200, 'MISMATCH']);
  check('B2 환불 반영 / 구독 불변', [db(`select concat_ws('|', status, apply_result) from sys_subscription_invoice
    where sys_id='${oldInvoice?.invoiceSysId}'`), state()], ['REFUNDED|MISMATCH', beforeRefund]);

  console.log('== 추가: Admin 즉시 종료');
  const ended = await call(boss, 'POST', `${admin}/${subId}/end`);
  const endSnap = snap(plant, 'Admin 종료');
  check('즉시 종료', [ended.status, endSnap.sub, endSnap.owner],
    [200, ['EXPIRED granted=Y revoked=Y end=DONE pm=ACTIVE'], '02']);
});

test('추가 / 만료된 결제 시도의 대사가 실패한 상태에서 재결제', async () => {
  test.setTimeout(120_000);
  const who = owner(5);
  const plant = who.number;
  check('4e 가입', (await signupByApi(await session(), who)).status, 200);
  const user = await session(who.userId, newPassword);
  const first = await startCheckout(user);
  const sub = providerSub(plant);
  await fakeConsole(user, 'webhooks', { enabled: 'false' });
  check('4e 결제 성공(웹훅 유실)', await payFake(user, first.token), 200);
  await fakeConsole(user, 'webhooks', { enabled: 'true' });
  db(`update sys_subscription set checkout_expires_at = now() - interval '1 minute' where plant_cd='${plant}'`);
  check('4e 결제 시작 전 DB(웹훅 유실)', snap(plant, '4e 유실'),
    { sub: ['PENDING granted=N revoked=N end=NONE pm=NONE'], owner: '02', inv: [], evt: [] });
  const base = fingerprint(plant);
  await fakeConsole(user, 'lookup-failures', { count: '1' });
  const failed = await startCheckout(user);
  check('4e [B1 / 정책 §6] 대사 실패 -> 503, 기존 등록 유지',
    { status: failed.status, launched: failed.token !== '', sameRegistration: providerSub(plant) === sub },
    { status: 503, launched: false, sameRegistration: true });
  check('4e [B1] 503 뒤 DB 변화 없음 / 새 제공자 등록 없음', [fingerprint(plant), registrations(plant, sub).length],
    [base, 1]);

  const retry = await startCheckout(user);
  check('4e [B1] 다시 시도 -> 놓친 결제 반영, 새 결제는 409', [retry.status, retry.token, providerSub(plant) === sub],
    [409, '', true]);
  const applied: Snap = { sub: ['ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE'], owner: '01',
    inv: ['PAID refunded=0 APPLIED'], evt: [] };
  check('4e [B1] 반영 뒤 DB', snap(plant, '4e 재시도'), applied);
  check('4e [B1] 제공자 등록 1 / 제공자 PAID 1', [registrations(plant, sub).length, providerPaid(plant, sub)], [1, 1]);
  await fakeConsole(user, 'resend', { webhookId: delivery(sub, 'Invoice.Paid').webhookId });
  check('4e 유실됐던 첫 웹훅 재전송 -> 200, 인보이스 1 유지',
    [delivery(sub, 'Invoice.Paid').lastStatus, snap(plant, '4e 첫 웹훅 재전송')],
    [200, { ...applied, evt: ['Invoice.Paid PROCESSED'] }]);
});

test('추가 / 재확인 동시 2건 / 사용 중 요금제 409 / 만료 뒤 직원 결제 403', async () => {
  test.setTimeout(180_000);
  // 가짜 사업자 확인이 받는 번호는 5개뿐이라, 앞 시나리오가 쓴 번호 5를 비우고 다시 가입한다.
  const who = owner(5);
  const plant = who.number;
  cleanup([plant]);
  check('9 가입', (await signupByApi(await session(), who)).status, 200);
  const user = await session(who.userId, newPassword);
  await payFake(user, (await startCheckout(user)).token);
  const activeRow = 'ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE';
  check('9 준비 DB', snap(plant, '9 준비').sub, [activeRow]);

  console.log('== 9a 재확인 동시 2건');
  const pair = await Promise.all([1, 2].map(() => call(user, 'POST', `${api}/reconcile`)));
  check('9a 동시 2건 -> 200 하나 + 429 하나', pair.map((r) => r.status).sort(), [200, 429]);
  check('9a 재확인 뒤 DB', snap(plant, '9a').inv, ['PAID refunded=0 APPLIED']);

  console.log('== 9b §5 진행 중 구독이 쓰는 요금제');
  const boss = await session('demo_admin');
  const planSysId = column(plant, 'plan_sys_id');
  const planRow = () => db(`select p::text from sys_payment p where sys_id='${planSysId}'`);
  const original = JSON.parse(db(`select json_build_object('sysId', sys_id, 'paymentCd', payment_cd,
    'paymentNm', payment_nm, 'paymentFee', payment_fee, 'paymentFeeUnit', payment_fee_unit,
    'licenseValidMonth', license_valid_month, 'deleteYn', delete_yn, 'modifyUserId', modify_user_id,
    'modifyDatetime', modify_datetime::text) from sys_payment where sys_id='${planSysId}'`)) as {
    sysId: string; paymentCd: string; paymentNm: string; paymentFee: number; paymentFeeUnit: string;
    licenseValidMonth: number; deleteYn: string; modifyUserId: string | null; modifyDatetime: string | null;
  };
  const literal = (value: string | number | null) => (value === null ? 'null' : `'${String(value).replace(/'/g, "''")}'`);
  const originalRow = planRow();
  const { deleteYn, modifyUserId, modifyDatetime, ...plan } = original;
  // 요금제 저장은 세션의 메뉴 코드를 감사 로그에 남긴다.
  await call(boss, 'POST', `/api/log/log/menu_open_access_log?menuCd=${qaMenu}`);
  const save = (change: Partial<typeof plan>) =>
    call(boss, 'POST', '/api/system/settings/payment/update', { ...plan, ...change });
  const audits = () => db(`select count(*) from sys_audit_trail where menu_cd='${qaMenu}'`);
  try {
    check('9b 금액 수정', (await save({ paymentFee: plan.paymentFee + 1000 })).status, 409);
    check('9b 기간 수정', (await save({ licenseValidMonth: plan.licenseValidMonth + 1 })).status, 409);
    check('9b 이름 + 금액 동시 수정', (await save(
      { paymentNm: `${plan.paymentNm} AUTO-QA`, paymentFee: plan.paymentFee + 1000 })).status, 409);
    check('9b 삭제', (await call(boss, 'POST', '/api/system/settings/payment/del', [plan])).status, 409);
    check('9b 409 뒤 요금제 행 / 감사 로그 변화 없음', [planRow(), audits()], [originalRow, '0']);
    check('9b 이름만 수정', (await save({ paymentNm: `${plan.paymentNm} AUTO-QA` })).status, 200);
    check('9b 이름만 바뀜', db(`select concat_ws('|', payment_nm, payment_fee, payment_fee_unit, license_valid_month,
      delete_yn) from sys_payment where sys_id='${planSysId}'`),
    [`${plan.paymentNm} AUTO-QA`, plan.paymentFee, plan.paymentFeeUnit, plan.licenseValidMonth, deleteYn].join('|'));
  } finally {
    db(`update sys_payment set payment_nm=${literal(plan.paymentNm)}, payment_fee=${literal(plan.paymentFee)},
      payment_fee_unit=${literal(plan.paymentFeeUnit)}, license_valid_month=${literal(plan.licenseValidMonth)},
      delete_yn=${literal(deleteYn)}, modify_user_id=${literal(modifyUserId)},
      modify_datetime=${literal(modifyDatetime)} where sys_id='${planSysId}'`);
  }
  check('9b 요금제 시드 원복', planRow(), originalRow);

  console.log('== 9c EXPIRED 매장의 직원 결제');
  const ended = await call(boss, 'POST', `${admin}/${column(plant, 'sys_id')}/end`);
  check('9c 준비 EXPIRED', [ended.status, column(plant, 'status')], [200, 'EXPIRED']);
  const staff = await session(insertStaff(who));
  const rows = () => db(`select (select count(*) from sys_subscription where plant_cd='${plant}') || '/'
    || (select count(*) from sys_subscription_invoice i join sys_subscription s on s.sys_id=i.subscription_sys_id
      where s.plant_cd='${plant}') || '/' || (select count(*) from sys_user where plant_cd='${plant}') || '/'
    || (select count(*) from sys_audit_trail where sys_plant_cd='${plant}')`);
  const since = providerSub(plant);
  const before = [rows(), fingerprint(plant), registrations(plant, since).length];
  const denied = await call(staff, 'POST', `${api}/checkout`, { planSysId });
  check('9c 직원 결제 403', denied.status, 403);
  check('9c 쓰기 0(행 수 / 전체 해시 / 제공자 등록)',
    [rows(), fingerprint(plant), registrations(plant, since).length], before);
  console.log(`OBS 9c 구독/인보이스/사용자/감사 행 ${before[0]}`);
});

test('7 Admin 목록 / 상세 / 환불', async ({ page }) => {
  test.setTimeout(300_000);
  const who = owner(3);
  const plant = who.number;
  check('7 가입', (await signupByApi(await session(), who)).status, 200);
  const user = await session(who.userId, newPassword);
  const started = await startCheckout(user);
  await payFake(user, started.token);
  const sub = providerSub(plant);
  await fakeConsole(user, 'next-period', { subscriptionId: sub, success: 'true' });
  check('7 준비 DB', snap(plant, '7 준비').inv, ['PAID refunded=0 APPLIED', 'PAID refunded=0 APPLIED']);
  const paidThrough = column(plant, 'paid_through_at');

  await page.goto('/admin/login');
  await page.getByLabel('아이디', { exact: true }).fill('demo_admin');
  await page.getByLabel('비밀번호', { exact: true }).fill(process.env.QA_AUTH_FIXTURE_PASSWORD!);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/main$/);
  await page.goto('/admin/subscriptions');
  const row = page.getByRole('table', { name: '구독 목록' }).getByRole('row').filter({ hasText: who.plantNm });
  await expect(row).toContainText('구독 중');
  check('7 Admin 목록 행', (await row.innerText()).includes(`${who.userId} (01)`), true);
  await row.getByRole('button', { name: who.plantNm }).click();
  const invoices = page.getByRole('table', { name: '인보이스' });
  await expect(invoices.getByRole('row')).toHaveCount(3);
  check('7 Admin 상세 인보이스 행', await invoices.getByRole('row').count(), 3);
  check('7 Admin 상세 웹훅 행(헤더 포함)',
    await page.getByRole('table', { name: '웹훅 이력' }).getByRole('row').count(), 3);

  const subId = column(plant, 'sys_id');
  const detail = (await call(page.request, 'GET', `${admin}/${subId}`)).body;
  const [currentInv, nextInv] = [...detail.invoices].sort((a: { periodStartAt: string }, b: { periodStartAt: string }) =>
    a.periodStartAt.localeCompare(b.periodStartAt));
  check('7 Admin 상세 API', [detail.invoices.length, detail.events.length, detail.canEnd], [2, 2, true]);
  const refund = (invoiceSysId: string, amount: number) =>
    call(page.request, 'POST', `${admin}/${subId}/refund`, { invoiceSysId, amount });

  console.log('== 7a 현재 회차가 아닌 인보이스(다음 회차) 전액 환불 -> 권한 유지');
  check('7a 환불', (await refund(nextInv.invoiceSysId, 29000)).status, 200);
  const kept = snap(plant, '7a');
  check('7a 권한 유지', [kept.sub, kept.owner, kept.inv], [['ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE'], '01',
    ['PAID refunded=0 APPLIED', 'REFUNDED refunded=29000 APPLIED']]);
  console.log(`7a 관찰: paid_through 환불 전 ${paidThrough} / 후 ${column(plant, 'paid_through_at')}`);
  check('7a 환불 끝난 인보이스 재환불', (await refund(nextInv.invoiceSysId, 1)).status, 409);

  console.log('== 7b 현재 회차 부분 환불 2회 -> 전액');
  check('7b 초과 금액', (await refund(currentInv.invoiceSysId, 29001)).status, 400);
  check('7b 0원', (await refund(currentInv.invoiceSysId, 0)).status, 400);
  await row.getByRole('button', { name: who.plantNm }).click();
  await page.reload();
  await page.getByRole('table', { name: '구독 목록' }).getByRole('button', { name: who.plantNm }).click();
  const input = page.getByLabel(`${currentInv.providerInvoiceId} 환불 금액`);
  await input.fill('10000');
  const [uiRefund] = await Promise.all([
    page.waitForResponse((r) => new URL(r.url()).pathname === `${admin}/${subId}/refund`),
    input.locator('..').getByRole('button', { name: '환불' }).click(),
  ]);
  check('7b 1차(화면) 10000', uiRefund.status(), 200);
  const partial = snap(plant, '7b 1차');
  check('7b 1차 뒤 권한 유지', [partial.sub, partial.owner, partial.inv[0]],
    [['ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE'], '01', 'PARTIALLY_REFUNDED refunded=10000 APPLIED']);
  check('7b 2차 19000', (await refund(currentInv.invoiceSysId, 19000)).status, 200);
  const full = snap(plant, '7b 2차');
  check('7b 누적 전액 -> EXPIRED / 02 / 종료', [full.sub, full.owner, full.inv[0]],
    [['EXPIRED granted=Y revoked=Y end=DONE pm=ACTIVE'], '02', 'REFUNDED refunded=29000 APPLIED']);
  check('7b 제공자 종료', fakeState().subscriptions[sub].status, 'ENDED');
  check('7b 대표 메뉴 API', (await call(user, 'GET', menuRead)).status, 403);
  await page.reload();
  await expect(page.getByRole('table', { name: '구독 목록' }).getByRole('row').filter({ hasText: who.plantNm }))
    .toContainText('만료');
});

test('7 대표 삭제 409 / 수동 승격 영구 01', async () => {
  test.setTimeout(300_000);
  const who = owner(4);
  const plant = who.number;
  check('7c 가입', (await signupByApi(await session(), who)).status, 200);
  const boss = await session('demo_admin');
  const userSysId = db(`select sys_id from sys_user where user_id='${who.userId}'`);
  const remove = () => call(boss, 'POST', '/api/system/settings/adminuser/save',
    { newItems: [], updateItems: [], delItems: [{ sysId: userSysId, userId: who.userId, userNm: who.name }] });
  const base = fingerprint(plant);
  check('7c PENDING 대표 삭제', (await remove()).status, 409);
  check('7c 변화 없음', fingerprint(plant), base);
  const user = await session(who.userId, newPassword);
  await payFake(user, (await startCheckout(user)).token);
  const active = fingerprint(plant);
  check('7c ACTIVE 대표 삭제', (await remove()).status, 409);
  check('7c ACTIVE 삭제 뒤 변화 없음', fingerprint(plant), active);
  check('7d 승격 전', [snap(plant, '7d 전').sub, snap(plant, '7d 전').owner],
    [['ACTIVE granted=Y revoked=N end=NONE pm=ACTIVE'], '01']);
  check('7d 대표 본인 승격 호출', (await call(user, 'POST', `/api/system/client-users/${userSysId}/promote`)).status, 403);
  const promoted = await call(boss, 'POST', `/api/system/client-users/${userSysId}/promote`);
  check('7d 수동 승격', [promoted.status, promoted.body.message], [200, '영구 권한으로 전환 완료.']);
  check('7d 승격 뒤 DB', snap(plant, '7d 승격').sub, ['ACTIVE granted=N revoked=N end=NONE pm=ACTIVE']);
  check('7d 해지', (await call(user, 'POST', `${api}/cancel`)).status, 200);
  await batch(user, kst(plant, 'end_at'));
  const survived = snap(plant, '7d 만료 뒤');
  check('7d 만료 뒤 01 유지', [survived.sub, survived.owner],
    [['EXPIRED granted=N revoked=N end=DONE pm=ACTIVE'], '01']);
  check('7d 만료 뒤 메뉴 API', (await call(user, 'GET', menuRead)).status, 200);
  check('7d 레거시 01 유지', db(`select user_role from sys_user where user_id='demo_owner'`), '01');
});

test('추가 / 요금제 삭제와 결제 시작이 겹치면 하나만 성공', async () => {
  test.setTimeout(180_000);
  const who = owner(5);
  const plant = who.number;
  cleanup([plant]);
  check('10 가입', (await signupByApi(await session(), who)).status, 200);
  const user = await session(who.userId, newPassword);
  const boss = await session('demo_admin');
  await call(boss, 'POST', `/api/log/log/menu_open_access_log?menuCd=${qaMenu}`);
  const newPlan = async (tag: string) => {
    const plan = { paymentCd: `AUTO-QA-sub-${tag}-${run}`, paymentNm: `AUTO-QA-sub ${tag}`, paymentFee: 99000,
      paymentFeeUnit: 'KRW', licenseValidMonth: 1 };
    check(`10 요금제 ${tag} 생성`, (await call(boss, 'POST', '/api/system/settings/payment/new', plan)).status, 200);
    return { ...plan, sysId: db(`select sys_id from sys_payment where payment_cd='${plan.paymentCd}'`) };
  };
  const deleted = (sysId: string) => db(`select delete_yn from sys_payment where sys_id='${sysId}'`);
  const audits = () => Number(db(`select count(*) from sys_audit_trail where menu_cd='${qaMenu}'`));
  const registered = () => Object.values(fakeState().subscriptions).filter((s) => s.plantCd === plant).length;
  const first = await newPlan('planA');
  const second = await newPlan('planB');

  /** 선행 요청이 플랜 행을 잠근 뒤 holder에서 멈추고, 후행 요청은 그 플랜 행 잠금에서 기다리게 만든다. */
  const race = async (label: string, holderSql: string, leaderAt: RegExp,
    leader: () => ReturnType<typeof call>, follower: () => ReturnType<typeof call>) => {
    const holder = await holdLock(holderSql);
    const answered: string[] = [];
    let lead: ReturnType<typeof call> | undefined;
    let follow: ReturnType<typeof call> | undefined;
    try {
      lead = leader().finally(() => answered.push('leader'));
      const leadPid = await waitBlocked(holder.pid, leaderAt, `${label} 선행 요청`);
      follow = follower().finally(() => answered.push('follower'));
      await waitBlocked(leadPid, /from sys_payment .*for update/i, `${label} 후행 요청(플랜 행)`);
      check(`${label} 두 요청 모두 응답 전`, answered, []);
    } finally {
      await holder.release();
    }
    return Promise.all([lead!, follow!]);
  };

  console.log('== 10a 삭제가 플랜 잠금을 먼저 잡음 (감사 로그 테이블 잠금으로 삭제를 세움)');
  const base = [fingerprint(plant), registered()];
  const [removed, rejected] = await race('10a', 'lock table sys_audit_trail in share mode', /sys_audit_trail/i,
    () => call(boss, 'POST', '/api/system/settings/payment/del', [second]),
    () => call(user, 'POST', `${api}/checkout`, { planSysId: second.sysId }));
  check('10a 삭제 200 / 결제 시작 400', [removed.status, rejected.status, rejected.body?.message],
    [200, 400, '플랜을 선택해 주세요.']);
  check('10a 요금제 삭제됨 / 구독 DB 변화 없음 / 제공자 등록 수 변화 없음',
    [deleted(second.sysId), fingerprint(plant), registered()], ['Y', ...base]);

  console.log('== 10b 결제 시작이 플랜 잠금을 먼저 잡음 (구독 테이블 잠금으로 결제 시작을 세움)');
  const auditsBefore = audits();
  const [started, refused] = await race('10b', 'lock table sys_subscription in share mode', /update sys_subscription/i,
    () => call(user, 'POST', `${api}/checkout`, { planSysId: first.sysId }),
    () => call(boss, 'POST', '/api/system/settings/payment/del', [first]));
  check('10b 결제 시작 200 / 삭제 409', [started.status, refused.status, refused.body?.message],
    [200, 409, '진행 중인 구독이 쓰는 요금제는 삭제할 수 없습니다.']);
  check('10b 요금제 유지 / 삭제 감사 로그 0', [deleted(first.sysId), audits() - auditsBefore], ['N', 0]);
  check('10b 구독 스냅샷 = 그 요금제', db(`select concat_ws('|', status, plan_sys_id='${first.sysId}', amount,
    provider_subscription_id is not null) from sys_subscription where plant_cd='${plant}'`), 'PENDING|t|99000|t');
});

test('추가 / 카드 만료 뒤 늦은 갱신 Paid -> 배너 유지', async ({ page }) => {
  test.setTimeout(180_000);
  const who = owner(5);
  const plant = who.number;
  cleanup([plant]);
  check('11 가입', (await signupByApi(await session(), who)).status, 200);
  const user = await session(who.userId, newPassword);
  await payFake(user, (await startCheckout(user)).token);
  const sub = providerSub(plant);
  const method = async () => [column(plant, 'payment_method_status'),
    (await call(user, 'GET', api)).body.paymentMethodStatus];
  const applied = (count: number) => Array<string>(count).fill('PAID refunded=0 APPLIED');
  /** 갱신 결제는 성공했지만 Paid 웹훅이 아직 도착하지 않은 상태를 만든다. */
  const undelivered = async () => {
    await fakeConsole(user, 'webhooks', { enabled: 'false' });
    await fakeConsole(user, 'next-period', { subscriptionId: sub, success: 'true' });
    await fakeConsole(user, 'webhooks', { enabled: 'true' });
    const paid = delivery(sub, 'Invoice.Paid');
    check('11 갱신 Paid 미전송', paid.lastStatus, 0);
    return paid.webhookId;
  };
  check('11 준비 DB', [snap(plant, '11 준비').inv, await method()], [applied(1), ['ACTIVE', 'ACTIVE']]);

  console.log('== 11a 카드 만료 전 조회(ACTIVE)를 든 Paid가 만료 커밋 뒤에 반영됨');
  // 가짜 PG로는 두 조회의 순서를 만들 수 없어, 만료 커밋은 잠금을 쥔 psql 트랜잭션이 대신한다.
  const staleId = await undelivered();
  const before = column(plant, 'provider_updated_at');
  const holder = await holdLock(`select 1 from sys_subscription where plant_cd='${plant}' for update`);
  let resent: Promise<void> | undefined;
  try {
    resent = fakeConsole(user, 'resend', { webhookId: staleId });
    await waitBlocked(holder.pid, /from sys_subscription .*for update/i, '11a Paid 웹훅(조회 끝, 행 잠금)');
  } finally {
    await holder.release(`update sys_subscription set payment_method_status='EXPIRED',
      provider_updated_at=clock_timestamp() where plant_cd='${plant}';`);
  }
  await resent;
  check('11a 웹훅 200 / 갱신 반영 / 결제수단 EXPIRED 유지', [delivery(sub, 'Invoice.Paid').lastStatus,
    snap(plant, '11a').inv, await method()], [200, applied(2), ['EXPIRED', 'EXPIRED']]);
  db(`update sys_subscription set payment_method_status='ACTIVE', provider_updated_at='${before}'
    where plant_cd='${plant}'`);

  console.log('== 11b HTTP만: 갱신 결제 -> 카드 만료 -> 늦은 Paid 전달');
  const lateId = await undelivered();
  await fakeConsole(user, 'expire-card', { subscriptionId: sub });
  check('11b 카드 만료 웹훅', [delivery(sub, 'Customer.PaymentMethodRevoked').lastStatus, await method()],
    [200, ['EXPIRED', 'EXPIRED']]);
  const paidThrough = column(plant, 'paid_through_at');
  await fakeConsole(user, 'resend', { webhookId: lateId });
  check('11b 늦은 Paid 200 / 갱신 반영 / 결제수단 EXPIRED 유지', [delivery(sub, 'Invoice.Paid').lastStatus,
    eventResult(lateId), snap(plant, '11b').inv, await method()], [200, 'PROCESSED', applied(3), ['EXPIRED', 'EXPIRED']]);
  check('11b 기간은 늘어남', column(plant, 'paid_through_at') > paidThrough, true);
  await clientLogin(page, who.userId, newPassword);
  await expect(page.getByText(cardBanner)).toBeVisible();
  check('11b 화면 배너 유지 / 상태', [await page.getByText(cardBanner).count(), column(plant, 'status')], [1, 'ACTIVE']);
});
