// 직원호출 검증에는 D:/coding/qr_order-local/seed_qa.sql의 공통코드와
// 같은 디렉터리의 README-qa.md에 기록된 AUTOQA_B / 92번 테이블·QR 픽스처가 필요하다.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, test, type APIResponse, type Browser, type Page, type Response } from '@playwright/test';
import { openQaVisit } from './order-payment';

const baseURL = 'http://localhost:3000';
const clientPage = '/client/board/inquiry/management';
const adminPage = '/admin/inquiry/manage';
const clientQna = '/api/client/board/qna';
const adminQna = '/api/system/settings/board/qna';
const notices = '/api/system/settings/board/notice';
const settings = '/api/client/staff-call/settings';
const unread = '/api/client/staff-call/notifications/unread';
const fileList = '/api/attach_file';
const fixture = () => `AUTO-QA ops ${randomUUID().slice(0, 8)}`;

function db(sql: string) {
  const { PGHOST, PGPORT, PGDATABASE, QA_AUTH_PSQL } = process.env;
  if (PGHOST !== '127.0.0.1' || PGPORT !== '55432' || PGDATABASE !== 'qrdemo' || !QA_AUTH_PSQL) {
    throw new Error('로컬 qrdemo와 QA_AUTH_PSQL을 지정하세요.');
  }
  return execFileSync(QA_AUTH_PSQL, ['-X', '-w', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8', timeout: 8000,
  }).trim();
}

async function json(response: APIResponse | Response, status = 200) {
  const body = await response.json().catch(() => undefined);
  const shape = Array.isArray(body) ? `array(${body.length})` :
    body ? `{${Object.keys(body).join(',')}}` : response.headers()['content-type'] ?? 'empty';
  const path = new URL(response.url()).pathname;
  console.log(`${path} -> ${response.status()} ${shape}`);
  expect(response.status(), path).toBe(status);
  return body;
}

async function login(browser: Browser, userId: string, plant: string, role?: string) {
  const userPassword = process.env.QA_AUTH_FIXTURE_PASSWORD;
  if (!userPassword) throw new Error('QA_AUTH_FIXTURE_PASSWORD가 필요합니다.');
  const context = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  const login = await context.request.post('/api/auth/login', { data: { userId, userPassword } });
  expect((await json(login)).success).toBe(true);
  const me = await json(await context.request.get('/api/auth/me'));
  expect(me.data).toMatchObject({ userId, sysPlantCd: plant, ...(role ? { staffRole: role } : {}) });
  return context;
}

function responseFor(page: Page, endpoint: string, method = 'GET') {
  return page.waitForResponse((response) => new URL(response.url()).pathname === endpoint &&
    response.request().method() === method);
}

function checkedId(value: string) {
  expect(value).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  return value;
}

async function searchInquiry(page: Page, title: string, endpoint: string) {
  const search = page.getByLabel('문의사항 검색어');
  await search.fill(title);
  const response = page.waitForResponse((result) => {
    const url = new URL(result.url());
    return url.pathname === `${endpoint}/search` && url.searchParams.get('searchKeyword') === title;
  });
  await search.press('Enter');
  expect((await response).status()).toBe(200);
  const rows = await json(await page.request.get(`${endpoint}/search`, { params: { searchKeyword: title } }));
  return rows.find((row: { qnaTitle: string }) => row.qnaTitle === title);
}

function payload(name: string, content: string | Buffer, mimeType = 'text/plain') {
  return { name, mimeType, buffer: Buffer.from(content) };
}

async function createInquiry(page: Page, title: string, attachment?: ReturnType<typeof payload>) {
  await page.goto(clientPage);
  await postForm(page, `${clientQna}/new`, { qnaTitle: title, qnaDescription: title }, attachment);
  const rows = await json(await page.request.get(`${clientQna}/search`, { params: { searchKeyword: title } }));
  return checkedId(rows.find((row: { qnaTitle: string }) => row.qnaTitle === title)?.sysId);
}

async function postForm(page: Page, path: string, fields: Record<string, string>, attachment?: ReturnType<typeof payload>) {
  const { status, body } = await page.evaluate(async ({ path, fields, file }) => {
    const form = new FormData();
    Object.entries(fields).forEach(([name, value]) => form.append(name, value));
    if (file) {
      const bytes = Uint8Array.from(atob(file.base64), (character) => character.charCodeAt(0));
      form.append('newItems[0].file', new Blob([bytes], { type: file.mimeType }), file.name);
    }
    const result = await fetch(path, { method: 'POST', body: form, signal: AbortSignal.timeout(12000) });
    return { status: result.status, body: await result.json().catch(() => undefined) };
  }, { path, fields, file: attachment && { ...attachment, buffer: undefined, base64: attachment.buffer.toString('base64') } });
  console.log(`${path} -> ${status} {${Object.keys(body ?? {}).join(',')}}`);
  expect(status).toBe(200);
  expect(body?.success).toBe(true);
}

async function auditMenu(page: Page, menuCd: string) {
  const response = await page.request.post('/api/log/log/menu_open_access_log', { params: { menuCd } });
  expect(response.status(), `감사 로그 메뉴 ${menuCd}`).toBe(200);
}

async function download(page: Page, name: string, contents: Buffer) {
  const pending = page.waitForEvent('download');
  const response = responseFor(page, `${fileList}/download`);
  await page.getByRole('button', { name: `${name} 다운로드`, exact: true }).click();
  expect((await response).status()).toBe(200);
  const result = await pending;
  expect(result.suggestedFilename()).toBe(`${name}.png`);
  expect(await readFile((await result.path())!)).toEqual(contents);
}

test('QNA-01a / QNA-01b 문의 시각과 원문·답변 첨부', async ({ browser }) => {
  const title = fixture();
  const originalName = `${title} original`;
  const answerName = `${title} answer`;
  const original = payload(`${originalName}.png`, Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv9sAAAAASUVORK5CYII=', 'base64',
  ), 'image/png');
  const answer = payload(`${answerName}.png`, Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64',
  ), 'image/png');
  const client = await login(browser, 'demo_owner', 'DEMO01', '01');
  const admin = await login(browser, 'demo_admin', 'ADMIN');
  const writer = await client.newPage();
  const reader = await admin.newPage();
  let sysId: string | undefined;

  try {
    console.log(title);
    sysId = await createInquiry(writer, title, original);
    const inquiryId = sysId;
    const modified = () => db(`select coalesce(modify_datetime::text, 'NULL') from brd_qna where sys_id='${inquiryId}'`);
    await reader.goto(adminPage);

    await test.step('신규 수정일은 DB/API null, 화면 -', async () => {
      const row = await searchInquiry(reader, title, adminQna);
      expect(row).toMatchObject({ sysId, modifyDatetime: null });
      expect(modified()).toBe('NULL');
      await expect(reader.getByRole('row').filter({ hasText: title }).getByRole('cell').nth(4)).toHaveText('-');
    });

    const updatedTitle = `${title} edited`;
    await test.step('Client 수정 후 Admin API/화면 시각은 DB와 일치', async () => {
      const response = await writer.request.post(`${clientQna}/update`, {
        data: { sysId, qnaTitle: updatedTitle, qnaDescription: updatedTitle },
      });
      expect((await json(response)).success).toBe(true);
      await reader.reload();
      const updated = await searchInquiry(reader, updatedTitle, adminQna);
      const stamp = modified();
      expect(stamp).not.toBe('NULL');
      expect(updated.modifyDatetime.replace('T', ' ').replace(/0+$/, '')).toBe(stamp.replace(/0+$/, ''));
      await expect(reader.getByRole('row').filter({ hasText: updatedTitle }).getByRole('cell').nth(4))
        .toHaveText(stamp.split('.')[0]);
      console.log(`Client 수정 시각 ${stamp}`);
    });

    const editor = reader.getByRole('dialog', { name: '문의사항 상세' });
    const answerText = editor.getByPlaceholder('답변 내용을 입력하세요');
    const input = editor.locator('input[type=file]');
    const openEditor = () => reader.getByRole('button', { name: `${updatedTitle} 상세 보기` }).click();
    const save = () => editor.getByRole('button', { name: '확인', exact: true }).click();
    await openEditor();
    const answerDescription = `${title} reply`;
    await answerText.fill(answerDescription);
    await expect(input).toBeEnabled();
    await input.setInputFiles(answer);
    const saveUrl = `**${adminQna}/update`;
    await test.step('답변 503의 초안 유지와 실서버 재시도', async () => {
      await reader.route(saveUrl, (route) => route.fulfill({
        status: 503, json: { success: false, message: 'AUTO-QA ops retry' },
      }), { times: 1 });
      const failed = responseFor(reader, `${adminQna}/update`, 'POST');
      await save();
      await json(await failed, 503);
      await reader.getByRole('dialog', { name: '오류' }).getByRole('button', { name: '확인' }).click();
      await expect(answerText).toHaveValue(answerDescription);
      await expect(editor.getByText(answer.name, { exact: true })).toBeVisible();
      // The local Admin catalog has no inquiry route. Supply its audit menu context.
      await auditMenu(reader, 'QNA');
      const multipartFields: Record<string, string> = {};
      await reader.exposeFunction('captureAnswerField', (name: string, value: string) => {
        multipartFields[name] = value;
      });
      await reader.evaluate((path) => {
        const originalFetch = window.fetch;
        const capture = (window as Window & {
          captureAnswerField?: (name: string, value: string) => Promise<void>;
        }).captureAnswerField;
        if (!capture) throw new Error('답변 multipart 수집 함수를 찾을 수 없습니다.');
        window.fetch = async (resource, options) => {
          if (resource === path && options?.body instanceof FormData) {
            for (const [name, value] of options.body.entries()) {
              await capture(name, typeof value === 'string' ? value : value.name);
            }
          }
          return originalFetch(resource, options);
        };
      }, `${adminQna}/update`);
      const pending = responseFor(reader, `${adminQna}/update`, 'POST');
      await save();
      const response = await pending;
      expect(response.request().headers()['content-type']).toContain('multipart/form-data; boundary=');
      expect(multipartFields).toMatchObject({
        'newItems[0].file': answer.name,
        'newItems[0].linkSysId': inquiryId,
        'newItems[0].convertFileNm': expect.any(String),
        'newItems[0].filePath': expect.any(String),
        'newItems[0].ordNo': '1',
        answerDescription,
      });
      expect(response.status()).toBe(200);
      console.log(`${adminQna}/update -> 200 multipart / 답변 저장 완료`);
      await reader.getByRole('dialog', { name: '안내' }).getByRole('button', { name: '확인' }).click();
    });

    await reader.reload();
    const answered = await searchInquiry(reader, updatedTitle, adminQna);
    await test.step('Admin 답변/최종 수정일 및 파일 연결 재조회', async () => {
      const stamp = modified();
      expect(answered).toMatchObject({ answerYn: 'Y', answerDescription });
      expect(answered.modifyDatetime).toBe(answered.answerDatetime);
      expect(answered.modifyDatetime.replace('T', ' ').replace(/0+$/, '')).toBe(stamp.replace(/0+$/, ''));
      await expect(reader.getByRole('row').filter({ hasText: updatedTitle }).getByRole('cell').nth(4))
        .toHaveText(stamp.split('.')[0]);
      console.log(`Admin 답변 후 수정 시각 ${stamp}`);
      const originalId = checkedId(answered.fileUlid);
      expect(originalId).not.toBe(inquiryId);
      for (const [link, name] of [[originalId, originalName], [inquiryId, answerName]] as const) {
        const rows = await json(await reader.request.get(fileList, { params: { linkSysId: link } }));
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ originalFileNm: name, fileExt: '.png' });
        expect(db(`select count(*) from attach_file where link_sys_id='${link}' and original_file_nm='${name}' and file_ext='.png'`)).toBe('1');
        console.log(`DB 연결 ${link} / ${name}.png`);
      }
    });

    await test.step('새로고침 뒤 Admin/Client 원문과 답변 다운로드', async () => {
      await openEditor();
      await writer.reload();
      await searchInquiry(writer, updatedTitle, clientQna);
      await writer.getByText(updatedTitle, { exact: true }).click();
      for (const page of [reader, writer]) {
        await download(page, originalName, original.buffer);
        await download(page, answerName, answer.buffer);
      }
    });

    await test.step('기존 파일 포함 한도와 닫기 후 임시 파일 초기화', async () => {
      await expect(input).toBeEnabled();
      const five = Array.from({ length: 5 }, (_, index) => payload(`${title} extra-${index}.txt`, 'extra'));
      await input.setInputFiles(five);
      await expect(editor.getByText('파일은 최대 4개까지 첨부할 수 있습니다.')).toBeVisible();
      await input.setInputFiles(payload(`${title} oversized.txt`, Buffer.alloc(10 * 1024 * 1024 + 1)));
      await expect(editor.getByText('파일당 최대 10MB까지 첨부할 수 있습니다.')).toBeVisible();
      const sixMiB = payload(`${title} total-limit.txt`, Buffer.alloc(6 * 1024 * 1024));
      const removeSixMiB = editor.getByRole('button', { name: `${sixMiB.name} 삭제`, exact: true });
      await test.step('실제 첨부 용량에서 같은 6 MiB 파일 허용', async () => {
        await input.setInputFiles(sixMiB);
        await expect(removeSixMiB).toBeVisible();
        await removeSixMiB.click();
        await expect(removeSixMiB).toHaveCount(0);
      });
      await test.step('테스트 전용: 기존 첨부 용량 메타데이터 주입 / 합계 한도', async () => {
        await editor.getByRole('button', { name: '닫기', exact: true }).click();
        await reader.route(`**${fileList}?linkSysId=${inquiryId}`, async (route) => {
          const actual = await route.fetch();
          const rows = await json(actual);
          expect(rows).toHaveLength(1);
          await route.fulfill({ response: actual, json: [{ ...rows[0], fileSize: '45' }] });
        }, { times: 1 });
        await reader.reload();
        await searchInquiry(reader, updatedTitle, adminQna);
        await openEditor();
        await expect(editor.getByRole('button', { name: `${answerName} 45.0 MB`, exact: true })).toBeVisible();
        await expect(input).toBeEnabled();
        await input.setInputFiles(sixMiB);
        // 전체 50 MB에서 기존 첨부 45 MB를 뺀 나머지가 오류 문구에 표시된다.
        await expect(editor.getByText('전체 파일 크기는 5MB를 초과할 수 없습니다.')).toBeVisible();
        await expect(removeSixMiB).toHaveCount(0);
      });
      await input.setInputFiles(five.slice(0, 1));
      await expect(editor.getByText(five[0].name, { exact: true })).toBeVisible();
      await editor.getByRole('button', { name: '닫기', exact: true }).click();
      await reader.getByRole('dialog', { name: '알림' }).getByRole('button', { name: '확인' }).click();
      await openEditor();
      await expect(editor.getByText(five[0].name, { exact: true })).toHaveCount(0);
      await expect(editor.getByRole('button', { name: `${answerName} 다운로드` })).toBeVisible();
    });
  } finally {
    if (sysId) await json(await writer.request.post(`${clientQna}/del`, { data: { sysId } }));
    await client.close();
    await admin.close();
  }
});

test('PLANT-01 담당자와 미제공 URL 표시', async ({ browser }) => {
  const admin = await login(browser, 'demo_admin', 'ADMIN');
  try {
    const page = await admin.newPage();
    const response = responseFor(page, '/api/system/settings/plant/search');
    await page.goto('/admin/system/plant');
    expect((await response).status()).toBe(200);
    const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'DEMO01', exact: true }) });
    await expect(row.getByRole('cell').nth(5)).toHaveText('-');
    await expect(row.getByRole('cell').nth(9)).toHaveText('-');
    await expect(row.getByRole('link')).toHaveCount(0);
    await expect(row.getByRole('button', { name: '접속' })).toHaveCount(0);
  } finally {
    await admin.close();
  }
});

test('NOTICE-01 / OPS-01 모두 읽음과 직원호출 미확인 유지', async ({ browser }) => {
  const title = fixture();
  const callCd = 'AUTO-QA-ops';
  const admin = await login(browser, 'demo_admin', 'ADMIN');
  const manager = await login(browser, 'autoqa_manager_b', 'AUTOQA_B', '01');
  const staff = await login(browser, 'autoqa_staff_b', 'AUTOQA_B', '02');
  const consumer = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  let settingId: string | undefined;
  let noticeId: string | undefined;
  let inquiryId: string | undefined;
  let callId: string | undefined;
  const readFlag = () => db(`select read_yn from consumer_staff_call_master where sys_id='${callId}'`);

  try {
    const combo = await json(await manager.request.get('/api/combo/common', { params: { code: 'STAFF_CALL_TYPE' } }));
    expect(combo).toContainEqual(expect.objectContaining({ code: callCd }));
    const previous = await json(await manager.request.get(settings));
    expect(previous.some((row: { callCd: string }) => row.callCd === callCd)).toBe(false);
    expect((await json(await manager.request.post(`${settings}/save`, {
      data: { newItems: [{ callCd, callNm: title, singleYn: 'Y', description: title }] },
    }))).success).toBe(true);
    const stored = await json(await manager.request.get(settings));
    settingId = checkedId(stored.find((row: { callCd: string }) => row.callCd === callCd)?.sysId);

    const adminTab = await admin.newPage();
    await adminTab.goto('/admin/notice/manage');
    await auditMenu(adminTab, 'NOTICE');
    await postForm(adminTab, `${notices}/new`, {
      noticeTitle: title, noticeDescription: title, target: 'all', useYn: 'Y',
      startDate: new Date(Date.now() - 86400000).toISOString().slice(0, 19).replace('T', ' '),
    });
    const noticeList = await json(await admin.request.get(`${notices}/search`, { params: { searchKeyword: title } }));
    noticeId = checkedId(noticeList.find((row: { noticeTitle: string }) => row.noticeTitle === title)?.sysId);

    const managerTab = await manager.newPage();
    const question = `${title} question`;
    inquiryId = await createInquiry(managerTab, question);
    await adminTab.goto(adminPage);
    await auditMenu(adminTab, 'QNA');
    await postForm(adminTab, `${adminQna}/update`, { sysId: inquiryId, answerYn: 'Y', answerDescription: `${title} reply` });

    const menu = await consumer.newPage();
    const tableSysId = '01KAZ000000000000000000007';
    await openQaVisit(menu, 'AUTOQA_B', {
      qrPath: '/qr/01KAZ000000000000000000009', tableSysId, tableNum: 92, menuName: 'AUTO-QA Menu B',
    });
    const callPath = '/api/client/consumer/orders/staffcall';
    expect((await json(await consumer.request.get(`${callPath}/search`))).some(
      (row: { callCd: string }) => row.callCd === callCd,
    )).toBe(true);
    expect((await json(await consumer.request.post(`${callPath}/new`, {
      data: { items: [{ callCd, quantity: 1 }] },
    }))).success).toBe(true);
    const isOwnCall = (row: { tableSysId: string; items: { callNm: string }[] }) =>
      row.tableSysId === tableSysId && row.items.some((item) => item.callNm === title);
    const before = await json(await staff.request.get(unread));
    callId = checkedId(before.find(isOwnCall)?.masterSysId);
    expect(readFlag()).toBe('N');

    const staffTab = await staff.newPage();
    await managerTab.reload();
    await staffTab.goto('/client/main');
    for (const page of [managerTab, staffTab]) {
      await page.getByRole('button', { name: /^(알림|읽지 않은 알림 \d+건)$/ }).click();
    }
    const managerPanel = managerTab.getByRole('dialog', { name: '알림' });
    const staffPanel = staffTab.getByRole('dialog', { name: '알림' });
    await expect(managerPanel.getByText(title, { exact: true }).first()).toBeVisible();
    await expect(managerPanel.getByText(question, { exact: true })).toBeVisible();
    const staffNotice = staffPanel.getByRole('button').filter({ hasText: title }).filter({ hasNotText: '92번 테이블 직원호출' });
    const staffCall = staffPanel.getByRole('button', { name: /92번 테이블 직원호출/ }).filter({ hasText: title });
    await expect(staffNotice).toHaveClass(/item--unseen/);
    await expect(staffCall).toHaveClass(/item--unseen/);
    const readRequests: string[] = [];
    staffTab.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/staff-call/notifications/')) {
        readRequests.push(new URL(request.url()).pathname);
      }
    });
    await staffPanel.getByRole('button', { name: '모두 읽음' }).click();
    await expect(staffNotice).not.toHaveClass(/item--unseen/);
    await expect(staffCall).toHaveClass(/item--unseen/);
    await expect(staffPanel.getByRole('button', { name: '모두 읽음' })).toHaveCount(0);
    expect((await json(await staff.request.get(unread))).find(isOwnCall)?.masterSysId).toBe(callId);
    expect(readFlag()).toBe('N');
    expect(readRequests).toEqual([]);
    console.log(`직원호출 ${callId} / 92번 / 모두 읽음 전후 DB N`);
  } finally {
    if (callId) await json(await staff.request.post(`/api/client/staff-call/notifications/${callId}/read`));
    if (settingId) await json(await manager.request.post(`${settings}/save`, { data: { delItems: [{ sysId: settingId }] } }));
    if (inquiryId) await json(await manager.request.post(`${clientQna}/del`, { data: { sysId: inquiryId } }));
    if (noticeId) {
      await auditMenu(admin.pages()[0], 'NOTICE');
      await json(await admin.request.post(`${notices}/del`, { data: [{ sysId: noticeId }] }));
    }
    await Promise.all([admin.close(), manager.close(), staff.close(), consumer.close()]);
  }
});
