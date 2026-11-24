import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { ConsumerMenuDetailEnvelope, OrderHistoryResponse } from '../src/generated/types';

const baseURL = 'http://localhost:3000';
const tag = `AUTO-QA qa-a ${randomBytes(4).toString('hex')}`;
const adminSave = '/api/system/settings/adminuser/save';
const historySearch = '/api/client/order_manage/history/search';
const consumerPath = '/api/client/consumer';
const tableId = '01DEMOTABLE0000000000000001';
const qaQr = '/api/qr/01DEMOQR00000000000000T001';
const menuManage = '/api/client/menu_manage';

test.use({ baseURL });

function db(sql: string) {
  const { PGHOST, PGPORT, PGDATABASE, QA_AUTH_PSQL } = process.env;
  if (PGHOST !== '127.0.0.1' || PGPORT !== '55432' || PGDATABASE !== 'qrdemo' || !QA_AUTH_PSQL) {
    throw new Error('로컬 qrdemo 연결과 QA_AUTH_PSQL이 필요합니다.');
  }
  return execFileSync(QA_AUTH_PSQL, ['-XwAqt', '-v', 'ON_ERROR_STOP=1'], {
    input: Buffer.from(sql), encoding: 'utf8', timeout: 8_000,
  }).trim();
}

function fixturePassword() {
  const password = process.env.QA_AUTH_FIXTURE_PASSWORD;
  if (!password) throw new Error('QA_AUTH_FIXTURE_PASSWORD가 필요합니다.');
  return password;
}

async function browserLogin(page: Page, userId: string) {
  await page.goto('/admin/login');
  await page.getByLabel('아이디', { exact: true }).fill(userId);
  await page.getByLabel('비밀번호', { exact: true }).fill(fixturePassword());
  const [response] = await Promise.all([
    page.waitForResponse((res) => new URL(res.url()).pathname === '/api/auth/login'),
    page.getByRole('button', { name: '로그인', exact: true }).click(),
  ]);
  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);
  console.log(`POST /api/auth/login (${userId}) -> 200 / success=true`);
}

test('5번 B / 매장 계정 Admin 로그인 안내와 직접 경로 제한', async ({ page }) => {
  await browserLogin(page, 'demo_owner');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('link', { name: '클라이언트 로그인' })).toHaveAttribute('href', '/client/login');
  await page.goto('/admin/main');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: '관리자 메인' })).toHaveCount(0);
  console.log('demo_owner / Client 링크 표시 / /admin/main 직접 접근 시 /admin/login');
});

test('5번 B / SUPER_ADMIN 메인, 신규 ADMIN 저장, 일반 매장 신규·수정 거부', async ({ page }) => {
  const userId = `qa_a_${tag.slice(-8)}`;
  const rejectedId = `${userId}_bad`;
  const ids = `user_id in ('${userId}', '${rejectedId}')`;
  expect(db(`select count(*) from sys_user where ${ids}`)).toBe('0');
  try {
    await browserLogin(page, 'demo_admin');
    await expect(page).toHaveURL(/\/admin\/main$/);
    await expect(page.getByRole('heading', { name: '관리자 메인' })).toBeVisible();
    const me = await page.request.get('/api/auth/me');
    expect(me.status()).toBe(200);
    expect((await me.json()).data).toMatchObject({ role: 'SUPER_ADMIN', userId: 'demo_admin' });
    console.log('demo_admin / SUPER_ADMIN / 관리자 메인 표시');

    await page.goto('/admin/system/admin-user');
    const table = page.getByRole('table', { name: '관리자 목록 테이블' });
    await expect(table).toBeVisible();
    const plants = await page.request.get('/api/combo/plant');
    expect(plants.status()).toBe(200);
    const plantList: { code: string; name: string }[] = await plants.json();
    const adminPlant = plantList.find(({ code }) => code === 'ADMIN');
    expect(plantList.some(({ code }) => code === 'DEMO01')).toBe(true);
    if (!adminPlant) throw new Error('사업장 API 응답에 ADMIN이 없습니다.');
    await page.getByRole('button', { name: /행추가/ }).click();
    const draft = table.locator('tbody tr').filter({ has: page.getByPlaceholder('아이디를 입력하세요') });
    await draft.getByPlaceholder('아이디를 입력하세요').fill(userId);
    await draft.getByPlaceholder('사용자 명을 입력하세요').fill(tag);
    await draft.getByRole('combobox').click();
    const choices = page.getByRole('listbox').getByRole('option');
    await expect.soft(choices).toHaveText([adminPlant.name]);
    console.log(`신규 사업장 옵션: ${(await choices.allTextContents()).join(', ')}`);
    await page.getByRole('option', { name: adminPlant.name, exact: true }).click();
    await page.getByRole('button', { name: '저장', exact: true }).click();
    const [saved] = await Promise.all([
      page.waitForResponse((res) => new URL(res.url()).pathname === adminSave),
      page.getByRole('button', { name: '확인', exact: true }).click(),
    ]);
    expect(saved.status()).toBe(200);
    expect((await saved.json()).success).toBe(true);
    expect(saved.request().postDataJSON().newItems).toEqual([
      expect.objectContaining({ userId, userNm: tag, plantCd: 'ADMIN' }),
    ]);
    await page.reload();
    await expect(table.locator(`input[value="${userId}"]`)).toBeVisible();
    const fixture = `from sys_user where user_id='${userId}'`;
    const sysId = db(`select sys_id ${fixture}`);
    const snapshot = () => db(`select count(*) || '|' || max(plant_cd) || '|' || max(user_nm) || '|' ||
      max(coalesce(modify_datetime::text, 'null')) ${fixture}`);
    expect(sysId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    const beforeUpdate = snapshot();
    expect(beforeUpdate).toMatch(/^1\|ADMIN\|AUTO-QA qa-a /);
    console.log(`POST ${adminSave} -> 200 / 새로고침 후 ${userId} / DB 1행 ADMIN`);

    const countNew = () => db(`select count(*) from sys_user where user_id='${rejectedId}'`);
    const beforeNew = countNew();
    for (const [kind, data, before, readAfter] of [
      ['newItems', { userId: rejectedId, userNm: tag, plantCd: 'DEMO01' }, beforeNew, countNew],
      ['updateItems', { sysId, userId, userNm: `${tag} changed`, plantCd: 'DEMO01' }, beforeUpdate, snapshot],
    ] as const) {
      const response = await page.request.post(adminSave, { data: { [kind]: [data] } });
      const body = await response.json();
      const after = readAfter();
      console.log(`${kind} DEMO01 -> ${response.status()} {${Object.keys(body).join(',')}} / DB ${before} -> ${after}`);
      expect.soft(response.status(), kind).toBe(400);
      expect.soft(after, kind).toBe(before);
    }
  } finally {
    db(`begin;
      delete from sys_audit_trail where table_nm='sys_user' and ref_key in (select sys_id from sys_user where ${ids});
      delete from sys_user where ${ids};
      commit;`);
    expect(db(`select count(*) from sys_user where ${ids}`)).toBe('0');
    console.log('QA 관리자 DB 정리 / 0행');
  }
});

async function checkedPost(session: APIRequestContext, path: string, options: Parameters<APIRequestContext['post']>[1], status = 200) {
  const response = await session.post(path, options);
  const body = await response.json();
  console.log(`POST ${path} -> ${response.status()} {${Object.keys(body).join(',')}}`);
  expect(response.status(), path).toBe(status);
  expect(body.success, path).toBe(true);
  return body.data;
}

test('Consumer 옵션 주문 / Client 주문 이력 응답과 화면', async ({ page, request }) => {
  await checkedPost(page.request, '/api/auth/login', {
    data: { userId: 'demo_owner', userPassword: fixturePassword() },
  });
  const me = await page.request.get('/api/auth/me');
  expect((await me.json()).data).toMatchObject({ userId: 'demo_owner', sysPlantCd: 'DEMO01' });
  const menuName = `${tag} Menu`;
  const optionName = `${tag} Option`;
  const masterScope = `sys_plant_cd='DEMO01' and link_sys_id='${tableId}'`;
  const visits = () => db(`select sys_id from order_master where ${masterScope} order by sys_id`).split(/\r?\n/).filter(Boolean);
  const visitsBefore = visits();
  expect(db(`select count(*) from order_master where ${masterScope} and order_status in ('01','02','03')`)).toBe('0');
  const scope = (field: string, name: string) => `sys_plant_cd='DEMO01' and ${field}='${name}'`;
  const menuScope = scope('menu_name', menuName);
  const optionScope = scope('menu_option_name', optionName);
  const groupScope = scope('group_name', tag);
  const categoryScope = scope('category_name', tag);
  const recordId = (table: string, where: string) => {
    const id = db(`select sys_id from ${table} where ${where}`);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    return id;
  };
  const clientRequestId = randomUUID();
  let visitRequested = false;
  let visitId: string | undefined;
  try {
    const session = page.request;
    await checkedPost(session, `${menuManage}/menu/master/new`, {
      data: { categoryName: tag, useYn: 'Y', ordNo: 99 },
    });
    const categoryId = recordId('store_menu_master', categoryScope);
    await checkedPost(session, `${menuManage}/menu/detail/save`, {
      multipart: {
        menuDetailRequest: {
          name: 'menuDetailRequest.json', mimeType: 'application/json',
          buffer: Buffer.from(JSON.stringify({
            newItems: [{
              linkSysId: categoryId, menuName, menuPrice: 2000, optionUseYn: 'Y',
              useYn: 'Y', soldOutYn: 'N', ordNo: 99,
            }],
          })),
        },
      },
    });
    const menuSysId = recordId('store_menu_detail', menuScope);
    const group = { linkSysId: menuSysId, groupName: tag, requiredYn: 'Y', inputType: '01', ordNo: 1 };
    await checkedPost(session, `${menuManage}/option/group/new`, {
      data: group,
    });
    const optionGroupId = recordId('store_menu_option_group', groupScope);
    await checkedPost(session, `${menuManage}/option/group/update`, {
      data: { ...group, sysId: optionGroupId, useYn: 'Y' },
    });
    const optionFields = {
      linkSysId: optionGroupId, menuOptionName: optionName, menuOptionPrice: '500',
      maximumNum: '0', defaultYn: 'N', soldOutYn: 'N', useYn: 'Y', ordNo: '1',
    };
    await checkedPost(session, `${menuManage}/option/detail/save`, {
      multipart: Object.fromEntries(Object.entries(optionFields).map(([key, value]) => [`newItems[0].${key}`, value])),
    });
    const optionSysId = recordId('store_menu_option_detail', optionScope);
    const qr = await request.get(qaQr);
    expect(qr.status()).toBe(200);
    expect((await qr.json()).success).toBe(true);
    visitRequested = true;
    const visit = await request.get(`${consumerPath}/session`);
    expect(visit.status()).toBe(200);
    const visitBody = (await visit.json()).data;
    expect(visitBody).toMatchObject({ sysPlantCd: 'DEMO01', tableSysId: tableId, status: 'ACTIVE', orderingAllowed: true });
    const newVisit = String(visitBody.consumerSessionId);
    expect(newVisit).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(visitsBefore).not.toContain(newVisit);
    visitId = newVisit;
    const detail = await request.get(`${consumerPath}/menu/${menuSysId}`);
    expect(detail.status()).toBe(200);
    const catalog: ConsumerMenuDetailEnvelope = await detail.json();
    expect(catalog.data.body.optionGroupList.flatMap((group) => group.optionList)).toContainEqual(
      expect.objectContaining({ menuOptionSysId: optionSysId, menuOptionName: optionName, menuOptionPrice: 500 }),
    );
    const order = await checkedPost(request, `${consumerPath}/orders`, {
      data: { clientRequestId, items: [{ menuSysId, quantity: 1, options: [{ optionSysId, quantity: 1 }] }] },
    }, 201);
    expect(order).toMatchObject({ status: 'RECEIVED', totalAmount: 2500, orderId: expect.stringMatching(/^[0-9A-HJKMNP-TV-Z]{26}$/) });
    console.log(`${tag} / 방문=${visitId} / 주문=${order.orderId} / 주문번호=${order.orderNo} / RECEIVED`);

    const [history] = await Promise.all([
      page.waitForResponse((res) => new URL(res.url()).pathname === historySearch),
      page.goto('/client/order/history/list'),
    ]);
    expect(history.status()).toBe(200);
    const historyBody: OrderHistoryResponse = await history.json();
    const row = historyBody.orderDetailHistory?.find((item) => item.masterSysId === visitId && item.menuName === menuName);
    console.log(`GET ${historySearch} -> 200 {${Object.keys(historyBody).join(',')}} / 상세=${row?.sysId} / menuOption=${row?.menuOption}`);
    expect.soft(row?.menuOption).toContain(`${optionName}500`);
    const list = page.getByRole('table', { name: '주문 이력 목록 테이블' });
    await expect(list.getByRole('row').filter({ has: page.getByRole('cell', { name: order.orderNo, exact: true }) })).toBeVisible();
    await expect.soft(page.getByText(optionName, { exact: false }), '주문 이력 화면의 옵션 이름').toBeVisible({ timeout: 2500 });
  } finally {
    const addedVisits = visitRequested ? visits().filter((id) => !visitsBefore.includes(id)) : [];
    const removedVisit = visitId ?? (addedVisits.length === 1 ? addedVisits[0] : undefined);
    if (removedVisit && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(removedVisit)) {
      const taggedDetail = `where link_sys_id='${removedVisit}' and link_sys_id2 in
        (select sys_id from store_menu_detail where ${menuScope})`;
      db(`begin;
        delete from consumer_order_idempotency where sys_plant_cd='DEMO01' and client_request_id='${clientRequestId}';
        create temporary table qa_a_order_group on commit drop as
          select distinct link_sys_id3 as sys_id from order_detail ${taggedDetail};
        delete from order_detail_option where link_sys_id in (select sys_id from order_detail ${taggedDetail});
        delete from order_detail ${taggedDetail};
        delete from order_group og using qa_a_order_group qa where og.sys_id=qa.sys_id
          and not exists (select 1 from order_detail where link_sys_id3=og.sys_id);
        delete from order_master om where ${masterScope} and sys_id='${removedVisit}'
          and not exists (select 1 from order_group where link_sys_id=om.sys_id);
        commit;`);
    }
    db(`begin;
      delete from store_menu_detail where ${menuScope};
      delete from store_menu_option_detail where ${optionScope};
      delete from store_menu_option_group where ${groupScope};
      delete from sys_audit_trail where table_nm='store_menu_master'
        and ref_key in (select sys_id from store_menu_master where ${categoryScope});
      delete from store_menu_master where ${categoryScope};
      commit;`);
    expect(visits()).toEqual(visitsBefore);
    for (const [table, where] of [
      ['store_menu_detail', menuScope], ['store_menu_option_detail', optionScope],
      ['store_menu_option_group', groupScope],
      ['store_menu_master', categoryScope],
    ]) {
      expect(db(`select count(*) from ${table} where ${where}`)).toBe('0');
    }
    console.log('QA 주문 방문 / 메뉴·옵션 픽스처 DB 정리');
  }
});
