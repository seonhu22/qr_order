import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { expect, test, type APIRequestContext } from '@playwright/test';

const baseURL = 'http://localhost:3000';
const qna = '/api/client/board/qna';
const notice = '/api/system/settings/board/notice';
const answer = '/api/system/settings/board/qna/update';
const menu = '/api/client/menu_manage';
const menuDetail = `${menu}/menu/detail/save`;
const optionDetail = `${menu}/option/detail/save`;
const files = '/api/attach_file';
const root = resolve('../qrorder/uploads');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB2sAAAAASUVORK5CYII=', 'base64');

type Fields = Record<string, string | { name: string; mimeType: string; buffer: Buffer }>;
type Parent = { sys_id: string; file_ulid: string };
type Attachment = {
  sys_id: string; link_sys_id: string; file_path: string; convert_file_nm: string;
  file_ext: string; pdf_yn: string; delete_yn: string;
};
const parentColumns = {
  brd_qna: 'qna_title', brd_notice: 'notice_title', store_menu_detail: 'menu_name',
  store_menu_option_detail: 'menu_option_name', store_menu_option_group: 'group_name',
  store_menu_option_master: 'category_name',
} as const;

function db(sql: string) {
  const { PGHOST, PGPORT, PGDATABASE, QA_AUTH_PSQL } = process.env;
  if (PGHOST !== '127.0.0.1' || PGPORT !== '55432' || PGDATABASE !== 'qrdemo' || !QA_AUTH_PSQL) {
    throw new Error('로컬 qrdemo 연결과 QA_AUTH_PSQL이 필요합니다.');
  }
  return execFileSync(QA_AUTH_PSQL, ['-X', '-w', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8', timeout: 8000,
  }).trim();
}

function query<T>(sql: string): T[] {
  return JSON.parse(db(`select coalesce(json_agg(r), '[]') from (${sql}) r`)) as T[];
}

function diskExists(path: string) {
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    'Test-Path -LiteralPath $env:QA_B_DISK_PATH -PathType Leaf'], {
    env: { ...process.env, QA_B_DISK_PATH: path }, encoding: 'utf8', timeout: 8000,
  }).trim() === 'True';
}

function attachmentPaths(row: Attachment) {
  const name = row.convert_file_nm;
  expect(name).toMatch(/^[A-Za-z0-9-]+$/);
  expect(row.file_ext).toMatch(/^\.(png|txt)$/);
  const paths = [join(row.file_path, name + row.file_ext)];
  if (row.pdf_yn === 'Y') paths.push(join(row.file_path, name + '.pdf'));
  return paths;
}

async function call(session: APIRequestContext, path: string, options: Parameters<APIRequestContext['fetch']>[1] = {}) {
  const start = performance.now();
  const response = await session.fetch(path, { timeout: 35_000, ...options });
  const body = await response.json().catch(() => undefined);
  const elapsed = Math.round(performance.now() - start);
  const shape = Array.isArray(body) ? `array(${body.length})` : `{${Object.keys(body ?? {}).join(',')}}`;
  console.log(`${options.method ?? 'GET'} ${path} -> ${response.status()} ${shape} ${elapsed} ms`);
  if (response.status() !== 200 && path === optionDetail) console.log(`옵션 상세 응답 메시지: ${body?.message ?? '없음'}`);
  expect(response.status(), path).toBe(200);
  return body;
}

async function login(session: APIRequestContext, userId: string, plant?: string) {
  const userPassword = process.env.QA_AUTH_FIXTURE_PASSWORD;
  if (!userPassword) throw new Error('QA_AUTH_FIXTURE_PASSWORD가 필요합니다.');
  const result = await call(session, '/api/auth/login', { method: 'POST', data: { userId, userPassword } });
  expect(result?.success, '테스트 계정 로그인').toBe(true);
  const me = await call(session, '/api/auth/me');
  expect(me.data).toMatchObject({ userId, ...(plant ? { sysPlantCd: plant } : {}) });
}

async function save(session: APIRequestContext, path: string, multipart: Fields) {
  const body = await call(session, path, { method: 'POST', multipart });
  expect(body?.success, path).toBe(true);
}

function upload(name: string, ext = 'png'): Fields {
  return {
    'newItems[0].file': {
      name: `${name}.${ext}`, mimeType: ext === 'txt' ? 'text/plain' : 'image/png',
      buffer: ext === 'txt' ? Buffer.from(`${name}\n`) : png,
    },
    'newItems[0].convertFileNm': randomUUID(), 'newItems[0].ordNo': '1',
  };
}

function remove(row: Attachment): Fields {
  return { 'delItems[0].sysId': row.sys_id };
}

test('qa-b / 실서버 첨부 저장, 재조회, 삭제', async ({ playwright }) => {
  test.setTimeout(240_000);
  const tag = `AUTO-QA qa-b ${randomUUID().slice(0, 8)}`;
  const client = await playwright.request.newContext({ baseURL });
  const admin = await playwright.request.newContext({ baseURL });
  const parents = (table: keyof typeof parentColumns, suffix = '%') => {
    const columns = table.endsWith('_master') || table.endsWith('_group') ? 'sys_id' : 'sys_id, file_ulid';
    return query<Parent>(`select ${columns} from ${table} where ${parentColumns[table]} like '${tag}-${suffix}'`);
  };
  const attachments = (suffix = '%') => query<Attachment>(
    `select sys_id, link_sys_id, file_path, convert_file_nm, file_ext, pdf_yn, delete_yn
     from attach_file where original_file_nm like '${tag}-${suffix}'`,
  );
  const show = async (session: APIRequestContext, linkSysId: string) =>
    await call(session, files, { params: { linkSysId } }) as { sysId: string; originalFileNm: string; pdfYn: string }[];

  async function saved(session: APIRequestContext, suffix: string, parent: string, converted = false) {
    const rows = attachments(suffix);
    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(row).toMatchObject({ link_sys_id: parent, delete_yn: 'N', pdf_yn: converted ? 'Y' : 'N' });
    expect(await show(session, parent)).toEqual(expect.arrayContaining([
      expect.objectContaining({ sysId: row.sys_id, originalFileNm: `${tag}-${suffix}`, pdfYn: row.pdf_yn }),
    ]));
    for (const path of attachmentPaths(row)) expect(diskExists(path), path).toBe(true);
    if (converted) expect(readFileSync(attachmentPaths(row)[1]).subarray(0, 5).toString()).toBe('%PDF-');
    console.log(`${suffix} 저장 / DB 활성 행 1 / 파일 ${attachmentPaths(row).length}개`);
    return row;
  }

  async function deleted(session: APIRequestContext, suffix: string, row: Attachment) {
    const list = await show(session, row.link_sys_id);
    const rows = attachments(suffix);
    const paths = attachmentPaths(row);
    const exists = paths.map(diskExists);
    console.log(`${suffix} 삭제 / 목록 ${list.some((item) => item.sysId === row.sys_id) ? '잔존' : '제외'} / DB ${rows[0]?.delete_yn ?? '행 없음'} / 디스크 ${exists.filter(Boolean).length}개 잔존`);
    expect(list.some((item) => item.sysId === row.sys_id)).toBe(false);
    expect(rows.filter((item) => item.delete_yn === 'N')).toHaveLength(0);
    expect(exists).toEqual(paths.map(() => false));
  }

  async function step(label: string, run: () => Promise<void>) {
    await test.step(label, async () => {
      try {
        await run();
        console.log(`${label} PASS`);
      } catch (error) {
        console.log(`${label} FAIL ${error instanceof Error ? error.message : String(error)}`);
        expect.soft(false, label).toBe(true);
      }
    });
  }

  async function openMenu(session: APIRequestContext, menuCd: string) {
    await call(session, '/api/log/log/menu_open_access_log', { method: 'POST', params: { menuCd } });
  }

  async function newQna(suffix: string, attachment: Fields = {}) {
    const title = `${tag}-${suffix}`;
    await save(client, `${qna}/new`, { qnaTitle: title, qnaDescription: title, ...attachment });
    const [parent] = parents('brd_qna', suffix);
    return parent;
  }

  function noticeFields(suffix: string): Fields {
    return {
      noticeTitle: `${tag}-${suffix}`, noticeDescription: tag, target: 'manager',
      startDate: `${new Date().toISOString().slice(0, 10)} 00:00:00`, useYn: 'N',
    };
  }

  function menuFields(request: object): Fields {
    return { menuDetailRequest: { name: 'blob', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(request)) } };
  }

  async function resetFixtures() {
    for (const row of attachments()) {
      for (const path of attachmentPaths(row)) {
        if (!diskExists(path)) continue;
        const underRoot = relative(realpathSync(root), realpathSync(dirname(path)));
        expect(underRoot === '..' || underRoot.startsWith(`..${sep}`) || isAbsolute(underRoot)).toBe(false);
        rmSync(path);
        expect(diskExists(path)).toBe(false);
      }
    }
    const ids = Object.keys(parentColumns).flatMap((table) => parents(table as keyof typeof parentColumns).map((row) => row.sys_id));
    for (const id of ids) expect(id).toMatch(/^[A-Z0-9]{26}$/);
    db(`begin;
        delete from attach_file where original_file_nm like '${tag}-%';
        delete from sys_audit_trail where ref_key in ('${ids.join("','")}');
        ${Object.entries(parentColumns).map(([table, column]) => `delete from ${table} where ${column} like '${tag}-%';`).join('\n')}
        commit;`);
    expect(attachments()).toHaveLength(0);
    for (const table of Object.keys(parentColumns) as (keyof typeof parentColumns)[]) expect(parents(table)).toHaveLength(0);
    expect(db(`select count(*) from sys_audit_trail where ref_key in ('${ids.join("','")}')`)).toBe('0');
    console.log(`${tag} / 테스트 행과 파일 정리 완료`);
  }

  try {
    await login(client, 'autoqa_manager_b', 'AUTOQA_B');
    await login(admin, 'demo_admin');

    await step('5 Client 문의 신규', async () => {
      const suffix = 'client-qna';
      const parent = await newQna(suffix, upload(`${tag}-${suffix}`));
      const row = await saved(client, suffix, parent.file_ulid);
      const result = await call(client, `${qna}/del`, { method: 'POST', data: { sysId: parent.sys_id } });
      expect(result?.success).toBe(true);
      const parentState = db(`select delete_yn from brd_qna where qna_title = '${tag}-${suffix}'`);
      console.log(`client-qna 부모 DB delete_yn=${parentState}`);
      expect(parentState).toBe('Y');
      await deleted(client, suffix, row);
    });

    for (const [suffix, createWithFile] of [
      ['notice-new', true], ['notice-update', false],
    ] as const) {
      await step(suffix, async () => {
        await openMenu(admin, 'NOTICE');
        const attachment = upload(`${tag}-${suffix}`);
        const fields = noticeFields(suffix);
        await save(admin, `${notice}/new`, { ...fields, ...(createWithFile ? attachment : {}) });
        const [parent] = parents('brd_notice', suffix);
        const update = { ...fields, sysId: parent.sys_id, fileUuid: parent.file_ulid };
        if (!createWithFile) await save(admin, `${notice}/update`, { ...update, ...attachment });
        const row = await saved(admin, suffix, parent.file_ulid);
        await save(admin, `${notice}/update`, { ...update, ...remove(row) });
        await deleted(admin, suffix, row);
      });
    }

    for (const [label, suffix, ext] of [
      ['8 Admin 문의 답변', 'answer', 'png'], ['12 Admin 문의 답변 TXT 변환', 'answer-txt', 'txt'],
    ] as const) {
      await step(label, async () => {
        const parent = await newQna(suffix);
        await openMenu(admin, 'QNA');
        const fields = { sysId: parent.sys_id, answerDescription: tag, answerYn: 'Y' };
        await save(admin, answer, { ...fields, ...upload(`${tag}-${suffix}`, ext) });
        const row = await saved(admin, suffix, parent.sys_id, ext === 'txt');
        await save(admin, answer, { ...fields, ...remove(row) });
        await deleted(admin, suffix, row);
      });
    }

    await step('9 메뉴 상세', async () => {
      const suffix = 'menu';
      const category = db("select sys_id from store_menu_master where sys_plant_cd = 'AUTOQA_B' and delete_yn = 'N' order by sys_id limit 1");
      expect(category).toMatch(/^[A-Z0-9]{26}$/);
      await openMenu(client, 'MENU');
      const newItems = [{ linkSysId: category, menuName: `${tag}-${suffix}`, menuPrice: 100,
        menuDescription: tag, optionUseYn: 'N', soldOutYn: 'N', useYn: 'N', ordNo: 1 }];
      await save(client, menuDetail, { ...menuFields({ newItems }), ...upload(`${tag}-${suffix}`) });
      const [parent] = parents('store_menu_detail', suffix);
      const row = await saved(client, suffix, parent.file_ulid);
      await save(client, menuDetail, { ...menuFields({}), linkSysId: parent.file_ulid, ...remove(row) });
      await deleted(client, suffix, row);
    });

    const optionFields = (suffix: string, group: string) => ({
      'newItems[0].linkSysId': group, 'newItems[0].menuOptionName': `${tag}-${suffix}`,
      'newItems[0].menuOptionPrice': '100', 'newItems[0].menuDescription': tag,
      'newItems[0].maximumNum': '1', 'newItems[0].defaultYn': 'N',
      'newItems[0].soldOutYn': 'N', 'newItems[0].useYn': 'N', 'newItems[0].ordNo': '1',
    });
    await openMenu(client, 'MENU_OPTION');
    await call(client, `${menu}/option/master/new`, { method: 'POST', data: { categoryName: `${tag}-master`, useYn: 'N', ordNo: 1 } });
    const [master] = parents('store_menu_option_master', 'master');
    await call(client, `${menu}/option/group/new`, { method: 'POST', data: { linkSysId: master.sys_id,
      groupName: `${tag}-group`, requiredYn: 'N', inputType: '01', useYn: 'N', ordNo: 1 } });
    const [group] = parents('store_menu_option_group', 'group');

    await step('10 메뉴 옵션 상세', async () => {
      const suffix = 'option-detail';
      try {
        await save(client, optionDetail, { ...optionFields(suffix, group.sys_id), ...upload(`${tag}-${suffix}`) });
      } catch (error) {
        console.log(`option-detail 실패 후 옵션 ${parents('store_menu_option_detail', suffix).length}행 / 첨부 ${attachments(suffix).length}행`);
        throw error;
      }
      const [parent] = parents('store_menu_option_detail', suffix);
      const row = await saved(client, suffix, parent.file_ulid);
      await save(client, optionDetail, { linkSysId: parent.file_ulid, ...remove(row) });
      await deleted(client, suffix, row);
    });

    await step('11 메뉴 옵션 공용 첨부 저장', async () => {
      const suffix = 'option-files';
      await save(client, optionDetail, optionFields(suffix, group.sys_id));
      const [parent] = parents('store_menu_option_detail', suffix);
      const linkSysId = parent.file_ulid;
      await save(client, `${files}/save`, { linkSysId, ...upload(`${tag}-${suffix}`) });
      const row = await saved(client, suffix, linkSysId);
      await save(client, `${files}/save`, { linkSysId, ...remove(row) });
      await deleted(client, suffix, row);
    });
  } finally {
    try {
      await resetFixtures();
    } finally {
      await Promise.all([client.dispose(), admin.dispose()]);
    }
  }
});

// ---- qa-sec: 첨부 범위 공격 확인 (6번 C 검사 1-4) ----
const logsDir = 'D:/coding/qr_order-local/logs';
const victimTxt = `${logsDir}/qa-b-victim.txt`;

async function attempt(session: APIRequestContext, path: string, options: Parameters<APIRequestContext['fetch']>[1] = {}) {
  const response = await session.fetch(path, { timeout: 35_000, ...options });
  const body = await response.json().catch(() => undefined);
  return { status: response.status(), message: String(body?.message ?? body?.error ?? '') };
}

test('qa-b / 보안 공격 확인 1-4', async ({ playwright }) => {
  test.setTimeout(300_000);
  const tag = `AUTO-QA qa-b ${randomUUID().slice(0, 8)}`;
  const attacker = await playwright.request.newContext({ baseURL });
  const owner = await playwright.request.newContext({ baseURL });
  const admin = await playwright.request.newContext({ baseURL });
  const results: string[] = [];
  const failures: string[] = [];

  const parent = (table: keyof typeof parentColumns, suffix: string) =>
    query<Parent>(`select sys_id, ${table.endsWith('_master') || table.endsWith('_group') ? "'' as file_ulid" : 'file_ulid'} from ${table} where ${parentColumns[table]} = '${tag}-${suffix}'`)[0];
  const rowsOf = (...ids: string[]) => query<Attachment & { ord_no: number; modify_datetime: string }>(
    `select sys_id, link_sys_id, file_path, convert_file_nm, file_ext, pdf_yn, delete_yn, ord_no, modify_datetime::text
     from attach_file where sys_id in ('${ids.join("','")}') order by sys_id`);
  const bySuffix = (suffix: string) => query<Attachment>(
    `select sys_id, link_sys_id, file_path, convert_file_nm, file_ext, pdf_yn, delete_yn from attach_file where original_file_nm = '${tag}-${suffix}'`);
  const state = (ids: string[]) => {
    const rows = rowsOf(...ids);
    return JSON.stringify({ rows, disk: rows.flatMap((row) => attachmentPaths(row).map(diskExists)), victim: diskExists(victimTxt) });
  };
  const count = (sql: string) => Number(db(sql));

  function record(id: string, label: string, ok: boolean, detail: string) {
    const line = `${id} ${label} / ${detail} / ${ok ? 'PASS' : 'FAIL'}`;
    console.log(line);
    results.push(line);
    if (!ok) failures.push(line);
  }

  // 요청을 보내 상태 코드와 보호 대상 DB/디스크 상태 변화를 기록한다.
  async function reject(id: string, label: string, session: APIRequestContext, path: string, multipart: Fields,
    watch: string[], expected = 404, extra: () => string = () => '') {
    const before = state(watch);
    let detail: string;
    let ok = false;
    try {
      const res = await attempt(session, path, { method: 'POST', multipart });
      const after = state(watch);
      const unchanged = before === after;
      ok = res.status === expected && unchanged;
      detail = `POST ${path} -> ${res.status} (기대 ${expected}) "${res.message}" / DB·디스크 ${unchanged ? '변화 없음' : '변경됨'} ${extra()}`;
      if (!unchanged) detail += `\n  before=${before}\n  after=${after}`;
    } catch (error) {
      detail = `예외 ${error instanceof Error ? error.message : String(error)}`;
    }
    record(id, label, ok, detail);
  }

  const newOption = (suffix: string, group: string) => ({
    'newItems[0].linkSysId': group, 'newItems[0].menuOptionName': `${tag}-${suffix}`,
    'newItems[0].menuOptionPrice': '100', 'newItems[0].menuDescription': tag,
    'newItems[0].maximumNum': '1', 'newItems[0].defaultYn': 'N',
    'newItems[0].soldOutYn': 'N', 'newItems[0].useYn': 'N', 'newItems[0].ordNo': '1',
  });
  const menuFields = (request: object): Fields => ({
    menuDetailRequest: { name: 'blob', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(request)) },
  });
  const noticeFields = (suffix: string): Fields => ({
    noticeTitle: `${tag}-${suffix}`, noticeDescription: tag, target: 'manager',
    startDate: `${new Date().toISOString().slice(0, 10)} 00:00:00`, useYn: 'N',
  });
  const openMenu = (session: APIRequestContext, menuCd: string) =>
    call(session, '/api/log/log/menu_open_access_log', { method: 'POST', params: { menuCd } });

  async function cleanup() {
    for (const row of query<Attachment>(`select sys_id, link_sys_id, file_path, convert_file_nm, file_ext, pdf_yn, delete_yn from attach_file where original_file_nm like '${tag}-%'`)) {
      const base = join(row.file_path, row.convert_file_nm);
      for (const path of [base + row.file_ext, `${base}.pdf`]) {
        if (!diskExists(path)) continue;
        const underRoot = relative(realpathSync(root), realpathSync(dirname(path)));
        expect(underRoot === '..' || underRoot.startsWith(`..${sep}`) || isAbsolute(underRoot)).toBe(false);
        rmSync(path);
      }
    }
    const tables = Object.keys(parentColumns) as (keyof typeof parentColumns)[];
    const ids = tables.flatMap((table) => query<Parent>(`select sys_id from ${table} where ${parentColumns[table]} like '${tag}-%'`).map((r) => r.sys_id));
    for (const id of ids) expect(id).toMatch(/^[A-Z0-9]{26}$/);
    db(`begin;
        delete from attach_file where original_file_nm like '${tag}-%';
        ${ids.length ? `delete from sys_audit_trail where ref_key in ('${ids.join("','")}');` : ''}
        ${tables.map((table) => `delete from ${table} where ${parentColumns[table]} like '${tag}-%';`).join('\n')}
        commit;`);
    db("delete from sys_login_log_detail where menu_cd = '../qa-b-menu-escape'");
    rmSync(victimTxt, { force: true });
    console.log(`${tag} / 정리 완료: 첨부 ${count(`select count(*) from attach_file where original_file_nm like '${tag}-%'`)}행 잔존`);
  }

  try {
    mkdirSync(logsDir, { recursive: true });
    writeFileSync(victimTxt, `qa-b victim ${tag}\n`);
    await login(attacker, 'autoqa_manager_b', 'AUTOQA_B');
    await login(owner, 'demo_owner', 'DEMO01');
    await login(admin, 'demo_admin');
    const adminMe = await call(admin, '/api/auth/me');
    console.log(`demo_admin 매장 코드 ${adminMe.data?.sysPlantCd ?? '없음'}`);

    // 피해자: 다른 매장(DEMO01) 문의 첨부
    await save(owner, `${qna}/new`, { qnaTitle: `${tag}-victim`, qnaDescription: tag, ...upload(`${tag}-victim`) });
    const [V] = bySuffix('victim');
    expect(V).toBeTruthy();
    expect(db(`select sys_plant_cd from attach_file where sys_id = '${V.sys_id}'`)).toBe('DEMO01');

    // 공격자(같은 매장 AUTOQA_B) 부모 2쌍: 메뉴 A/B, 옵션 A/B, 공지 A/B
    const category = db("select sys_id from store_menu_master where sys_plant_cd = 'AUTOQA_B' and delete_yn = 'N' order by sys_id limit 1");
    await openMenu(attacker, 'MENU');
    for (const s of ['menu-a', 'menu-b']) {
      await save(attacker, menuDetail, { ...menuFields({ newItems: [{ linkSysId: category, menuName: `${tag}-${s}`, menuPrice: 100,
        menuDescription: tag, optionUseYn: 'N', soldOutYn: 'N', useYn: 'N', ordNo: 1 }] }), ...upload(`${tag}-${s}-f`) });
    }
    await openMenu(attacker, 'MENU_OPTION');
    await call(attacker, `${menu}/option/master/new`, { method: 'POST', data: { categoryName: `${tag}-master`, useYn: 'N', ordNo: 1 } });
    const master = parent('store_menu_option_master', 'master');
    await call(attacker, `${menu}/option/group/new`, { method: 'POST', data: { linkSysId: master.sys_id,
      groupName: `${tag}-group`, requiredYn: 'N', inputType: '01', useYn: 'N', ordNo: 1 } });
    const group = parent('store_menu_option_group', 'group');
    for (const s of ['opt-a', 'opt-b']) {
      await save(attacker, optionDetail, newOption(s, group.sys_id));
      await save(attacker, `${files}/save`, { linkSysId: parent('store_menu_option_detail', s).file_ulid, ...upload(`${tag}-${s}-f`) });
    }
    await openMenu(admin, 'NOTICE');
    for (const s of ['notice-a', 'notice-b']) {
      await save(admin, `${notice}/new`, { ...noticeFields(s), ...upload(`${tag}-${s}-f`) });
    }
    await save(attacker, `${qna}/new`, { qnaTitle: `${tag}-own-qna`, qnaDescription: tag });

    const MA = parent('store_menu_detail', 'menu-a'); const MB = parent('store_menu_detail', 'menu-b');
    const OA = parent('store_menu_option_detail', 'opt-a'); const OB = parent('store_menu_option_detail', 'opt-b');
    const NA = parent('brd_notice', 'notice-a'); const NB = parent('brd_notice', 'notice-b');
    const [fMA] = bySuffix('menu-a-f'); const [fMB] = bySuffix('menu-b-f');
    const [fOA] = bySuffix('opt-a-f'); const [fOB] = bySuffix('opt-b-f');
    const [fNA] = bySuffix('notice-a-f'); const [fNB] = bySuffix('notice-b-f');
    for (const f of [fMA, fMB, fOA, fOB, fNA, fNB]) expect(f?.delete_yn).toBe('N');
    const del = (...rows: Attachment[]): Fields => Object.fromEntries(rows.map((row, i) => [`delItems[${i}].sysId`, row.sys_id]));
    const ownQna = parent('brd_qna', 'own-qna');
    const noticeUpdate = (n: Parent, extra: Fields): Fields => ({ ...noticeFields(n === NA ? 'notice-a' : 'notice-b'),
      sysId: n.sys_id, fileUuid: n.file_ulid, ...extra });
    console.log(`피해자 첨부 ${V.sys_id} (DEMO01) / 공격자 AUTOQA_B / 부모 준비 완료`);

    // 검사 1: 다른 매장 첨부 삭제 (모든 저장 API)
    const w1 = [V.sys_id];
    // 이 API는 newItems[*].file 만 바인딩한다(BoardController initBinder). delItems 는 무시되므로 200이어도 V 는 불변이어야 한다.
    await reject('1a', 'Client 문의 신규 + 타 매장 delItems(바인딩 제외)', attacker, `${qna}/new`,
      { qnaTitle: `${tag}-atk-1a`, qnaDescription: tag, ...del(V) }, w1, 200);
    await openMenu(attacker, 'MENU');
    await reject('1b', '메뉴 상세 / 자기 메뉴 + 타 매장 delItems', attacker, menuDetail,
      { ...menuFields({}), linkSysId: MA.file_ulid, ...del(V) }, w1);
    await reject('1c', '메뉴 상세 / 피해자 부모 linkSysId', attacker, menuDetail,
      { ...menuFields({}), linkSysId: V.link_sys_id, ...del(V) }, w1);
    await openMenu(attacker, 'MENU_OPTION');
    await reject('1d', '옵션 상세 / 자기 옵션 + 타 매장 delItems', attacker, optionDetail,
      { linkSysId: OA.file_ulid, ...del(V) }, w1);
    await reject('1e', '공용 첨부 저장 / 자기 옵션 + 타 매장 delItems', attacker, `${files}/save`,
      { linkSysId: OA.file_ulid, ...del(V) }, w1);
    await reject('1f', '공용 첨부 저장 / 피해자 부모 linkSysId', attacker, `${files}/save`,
      { linkSysId: V.link_sys_id, ...del(V) }, w1);
    await reject('1g', '공용 첨부 저장 / 타 매장 updateItems', attacker, `${files}/save`,
      { linkSysId: OA.file_ulid, 'updateItems[0].sysId': V.sys_id, 'updateItems[0].ordNo': '9' }, w1);
    await reject('1h', '공용 첨부 저장 / 자기 첨부 + 타 매장 동시 삭제(원자성)', attacker, `${files}/save`,
      { linkSysId: OA.file_ulid, ...del(fOA, V) }, [V.sys_id, fOA.sys_id]);
    await openMenu(admin, 'NOTICE');
    await reject('1i', '공지 수정 / 자기 공지 + 타 매장 delItems', admin, `${notice}/update`,
      noticeUpdate(NA, del(V)), [...w1, fNA.sys_id]);
    await openMenu(admin, 'QNA');
    await reject('1j', '문의 답변 / 타 매장 delItems', admin, answer,
      { sysId: ownQna.sys_id, answerDescription: tag, answerYn: 'Y', ...del(V) }, w1);

    // 검사 2: 위조 filePath / convertFileNm 으로 스크래치 파일 삭제 시도
    const forged: Fields = {
      'delItems[0].filePath': logsDir, 'delItems[0].convertFileNm': 'qa-b-victim', 'delItems[0].fileExt': '.txt',
      'delItems[0].pdfYn': 'N', 'delItems[0].mimeType': 'text/plain',
    };
    await openMenu(attacker, 'MENU_OPTION');
    for (const s of ['forge-1', 'forge-2']) {
      await save(attacker, `${files}/save`, { linkSysId: OA.file_ulid, ...upload(`${tag}-${s}`) });
    }
    const [F1] = bySuffix('forge-1'); const [F2] = bySuffix('forge-2');
    const fakeId = '01ZZZZZZZZZZZZZZZZZZZZZZZZ';
    await reject('2a', '삭제 위조 / 존재하지 않는 sysId + 위조 경로', attacker, `${files}/save`,
      { linkSysId: OA.file_ulid, 'delItems[0].sysId': fakeId, ...forged }, [V.sys_id, F1.sys_id], 404);
    await reject('2b', '삭제 위조 / 피해자 sysId + 위조 경로', attacker, `${files}/save`,
      { linkSysId: OA.file_ulid, ...del(V), ...forged }, [V.sys_id, F1.sys_id], 404);
    // 2c: 정상 첨부 F1 삭제에 위조 필드를 얹는다. 200이며 F1 파일만 사라지고 스크래치 파일은 남아야 한다.
    const pathsF1 = attachmentPaths(F1);
    const resF1 = await attempt(attacker, `${files}/save`, { method: 'POST',
      multipart: { linkSysId: OA.file_ulid, ...del(F1), ...forged } });
    const [F1after] = rowsOf(F1.sys_id);
    record('2c', '삭제 위조 / 자기 첨부 + 위조 경로·확장자·pdfYn', resF1.status === 200 && F1after.delete_yn === 'Y'
      && pathsF1.every((p) => !diskExists(p)) && diskExists(victimTxt),
      `POST ${files}/save -> ${resF1.status} / F1 DB ${F1after.delete_yn} / F1 파일 ${pathsF1.map(diskExists).join(',')} / 스크래치 파일 ${diskExists(victimTxt) ? '존재' : '삭제됨'}`);
    // 2d: updateItems 로 file_path 를 바꾼 뒤 삭제하는 2단계 공격
    const upd = await attempt(attacker, `${files}/save`, { method: 'POST', multipart: { linkSysId: OA.file_ulid,
      'updateItems[0].sysId': F2.sys_id, 'updateItems[0].ordNo': '5', 'updateItems[0].filePath': logsDir,
      'updateItems[0].convertFileNm': 'qa-b-victim', 'updateItems[0].fileExt': '.txt' } });
    const [F2mid] = rowsOf(F2.sys_id);
    const pathsF2 = attachmentPaths(F2);
    const res2 = await attempt(attacker, `${files}/save`, { method: 'POST', multipart: { linkSysId: OA.file_ulid, ...del(F2) } });
    record('2d', 'updateItems 위조 후 삭제', upd.status === 200 && F2mid.file_path === F2.file_path && F2mid.convert_file_nm === F2.convert_file_nm
      && res2.status === 200 && pathsF2.every((p) => !diskExists(p)) && diskExists(victimTxt),
      `update -> ${upd.status} / DB file_path ${F2mid.file_path === F2.file_path ? '불변' : '변조됨'} convert_file_nm ${F2mid.convert_file_nm === F2.convert_file_nm ? '불변' : '변조됨'} / delete -> ${res2.status} / 스크래치 파일 ${diskExists(victimTxt) ? '존재' : '삭제됨'}`);

    // 검사 3: 업로드 경로 위조
    const uploadRoot = realpathSync(root);
    const escapeDir = join(logsDir, 'qa-b-escape');
    const traversal = ['../../../qa-b-escape', `${logsDir}/qa-b-escape`, '..\\..\\qa-b-escape'];
    for (const [i, forgedPath] of traversal.entries()) {
      const s = `path-${i}`;
      const res = await attempt(attacker, `${files}/save`, { method: 'POST',
        multipart: { linkSysId: OA.file_ulid, ...upload(`${tag}-${s}`), 'newItems[0].filePath': forgedPath } });
      const [row] = bySuffix(s);
      const rel = row ? relative(uploadRoot, realpathSync(row.file_path)) : '';
      const underRoot = !!row && rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
      const stored = row ? attachmentPaths(row).every(diskExists) : false;
      const stray = row ? diskExists(join(escapeDir, row.convert_file_nm + row.file_ext)) || diskExists(join(logsDir, row.convert_file_nm + row.file_ext)) : false;
      record(`3${'abc'[i]}`, `filePath='${forgedPath}'`, res.status === 200 && underRoot && stored && !stray,
        `POST ${files}/save -> ${res.status} / 저장 경로 ${row?.file_path ?? '행 없음'} (루트 하위 ${underRoot}) / 저장 파일 ${stored} / 위조 위치 파일 ${stray ? '있음' : '없음'}`);
    }
    for (const [i, name] of ['../../../qa-b-escape-name', '..\\qa-b-escape-name', 'a:b', '..'].entries()) {
      const s = `name-${i}`;
      const res = await attempt(attacker, `${files}/save`, { method: 'POST', multipart: { linkSysId: OA.file_ulid, ...upload(`${tag}-${s}`), 'newItems[0].convertFileNm': name } });
      const rows = bySuffix(s);
      const leaked = diskExists(join(logsDir, 'qa-b-escape-name.png')) || diskExists(join(uploadRoot, '..', 'qa-b-escape-name.png'));
      record(`3${'defg'[i]}`, `convertFileNm='${name}'`, !leaked && (res.status >= 400 || rows.every((r) => !r.convert_file_nm.includes('/'))),
        `POST ${files}/save -> ${res.status} "${res.message}" / 행 ${rows.length}개${rows[0] ? ` convert_file_nm=${rows[0].convert_file_nm}` : ''} / 루트 밖 파일 ${leaked ? '있음' : '없음'}`);
    }
    // menuCd 는 세션 값이므로 공격자가 /menu_open_access_log 로 임의 값을 넣을 수 있다.
    const menuEscape = '../qa-b-menu-escape';
    const opened = await attempt(attacker, '/api/log/log/menu_open_access_log', { method: 'POST', params: { menuCd: menuEscape } });
    const resMenu = await attempt(attacker, `${files}/save`, { method: 'POST', multipart: { linkSysId: OA.file_ulid, ...upload(`${tag}-menucd`) } });
    const menuRows = bySuffix('menucd');
    const menuDirMade = existsSync(join(uploadRoot, '..', 'qa-b-menu-escape'));
    record('3h', `menuCd 세션값='${menuEscape}'`, !menuDirMade && menuRows.every((r) => {
      const rel = relative(uploadRoot, realpathSync(r.file_path));
      return !rel.startsWith('..') && !isAbsolute(rel);
    }),
      `menu_open_access_log -> ${opened.status} / 업로드 -> ${resMenu.status} "${resMenu.message}" / 행 ${menuRows.length}개${menuRows[0] ? ` 경로 ${menuRows[0].file_path}` : ''} / 루트 밖 디렉터리 ${menuDirMade ? '생성됨' : '없음'}`);
    await openMenu(attacker, 'MENU_OPTION');

    // 검사 4: 같은 매장 다른 부모
    await reject('4a', '옵션 A 요청으로 옵션 B 첨부 삭제', attacker, `${files}/save`,
      { linkSysId: OA.file_ulid, ...del(fOB) }, [fOB.sys_id]);
    await openMenu(attacker, 'MENU');
    await reject('4b', '메뉴 A 요청으로 메뉴 B 첨부 삭제', attacker, menuDetail,
      { ...menuFields({}), linkSysId: MA.file_ulid, ...del(fMB) }, [fMB.sys_id]);
    await openMenu(admin, 'NOTICE');
    await reject('4c', '공지 A 수정으로 공지 B 첨부 삭제', admin, `${notice}/update`,
      noticeUpdate(NA, del(fNB)), [fNB.sys_id, fNA.sys_id]);
    await openMenu(attacker, 'MENU_OPTION');
    await reject('4d', '옵션 A 요청 + 새 파일 linkSysId=옵션 B', attacker, `${files}/save`,
      { linkSysId: OA.file_ulid, ...upload(`${tag}-x4d`), 'newItems[0].linkSysId': OB.file_ulid }, [fOA.sys_id, fOB.sys_id], 404,
      () => `신규 행 ${count(`select count(*) from attach_file where original_file_nm = '${tag}-x4d'`)}개`);
    await openMenu(attacker, 'MENU');
    await reject('4e', '메뉴 A 요청 + 새 파일 linkSysId=메뉴 B', attacker, menuDetail,
      { ...menuFields({}), linkSysId: MA.file_ulid, ...upload(`${tag}-x4e`), 'newItems[0].linkSysId': MB.file_ulid }, [fMA.sys_id, fMB.sys_id], 404,
      () => `신규 행 ${count(`select count(*) from attach_file where original_file_nm = '${tag}-x4e'`)}개`);
    await openMenu(admin, 'NOTICE');
    const resN = await attempt(admin, `${notice}/update`, { method: 'POST',
      multipart: noticeUpdate(NA, { ...upload(`${tag}-x4f`), 'newItems[0].linkSysId': NB.file_ulid }) });
    const [x4f] = bySuffix('x4f');
    record('4f', '공지 A 수정 + 새 파일 linkSysId=공지 B', resN.status === 200 ? x4f?.link_sys_id === NA.file_ulid : resN.status === 404,
      `POST ${notice}/update -> ${resN.status} / 신규 첨부 연결 ${x4f ? (x4f.link_sys_id === NA.file_ulid ? '공지 A(서버가 덮어씀)' : x4f.link_sys_id === NB.file_ulid ? '공지 B(침해)' : '기타') : '없음'}`);

    // 참고: 읽기 API는 매장 범위를 확인하는가 (판정 제외, 상태 코드만 기록)
    for (const [label, path, params] of [
      ['목록', files, { linkSysId: V.link_sys_id }], ['다운로드', `${files}/download`, { sysId: V.sys_id }],
      ['보기', `${files}/view`, { sysId: V.sys_id }], ['전체 다운로드', `${files}/download_all`, { linkSysId: V.link_sys_id }],
    ] as const) {
      const response = await attacker.fetch(path, { params, timeout: 35_000 });
      console.log(`참고 읽기 ${label} GET ${path} (AUTOQA_B -> DEMO01 첨부) -> ${response.status()} ${(await response.body()).length} bytes`);
    }
  } finally {
    try {
      await cleanup();
    } finally {
      await Promise.all([attacker.dispose(), owner.dispose(), admin.dispose()]);
    }
  }
  console.log(`--- 요약 ${results.length - failures.length}/${results.length} PASS ---`);
  expect(failures, failures.join('\n')).toEqual([]);
});
