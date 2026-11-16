import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { URL } from 'node:url';

export function readQaConfig(file, overrides = {}) {
  const env = { ...parseEnv(readFileSync(file, 'utf8')), ...overrides };
  const required = ['QA_BASE_URL', 'QA_STORE_A_CODE', 'QA_MANAGER_A_ID',
    'QA_MANAGER_A_PASSWORD', 'QA_STAFF_A_ID', 'QA_STAFF_A_PASSWORD'];
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length) throw new Error(`필수 환경변수 누락: ${missing.join(', ')}`);
  const base = new URL(env.QA_BASE_URL);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password ||
    base.pathname !== '/' || base.search || base.hash) {
    throw new Error('QA_BASE_URL은 인증정보/경로/쿼리가 없는 HTTP(S) origin이어야 합니다.');
  }
  const accounts = [
    { label: 'manager-a', store: env.QA_STORE_A_CODE, role: '01', id: env.QA_MANAGER_A_ID, password: env.QA_MANAGER_A_PASSWORD },
    { label: 'staff-a', store: env.QA_STORE_A_CODE, role: '02', id: env.QA_STAFF_A_ID, password: env.QA_STAFF_A_PASSWORD },
  ];
  const bKeys = ['QA_STORE_B_CODE', 'QA_MANAGER_B_ID', 'QA_MANAGER_B_PASSWORD'];
  const configured = bKeys.filter((key) => env[key]?.trim());
  if (configured.length && configured.length !== bKeys.length) {
    throw new Error('B매장 변수는 3개 모두 입력하거나 모두 생략해야 합니다.');
  }
  if (configured.length) {
    if (env.QA_STORE_B_CODE === env.QA_STORE_A_CODE) throw new Error('A/B 매장 코드는 달라야 합니다.');
    accounts.push({ label: 'manager-b', store: env.QA_STORE_B_CODE, role: '01', id: env.QA_MANAGER_B_ID, password: env.QA_MANAGER_B_PASSWORD });
  }
  let orderFlow = null;
  if (env.QA_ENABLE_ORDER_PAYMENT === '1') {
    for (const key of ['QA_QR_URL', 'QA_TABLE_SYS_ID', 'QA_TABLE_NUM', 'QA_MENU_NAME']) {
      if (!env[key]?.trim()) throw new Error(`주문/결제 준비값 누락: ${key}`);
    }
    const qr = new URL(env.QA_QR_URL, base.origin);
    if (qr.origin !== base.origin || !/^\/qr\/[^/]+$/.test(qr.pathname) || qr.search || qr.hash) throw new Error('QA_QR_URL은 같은 서버의 /qr/식별자 주소여야 합니다.');
    if (!env.QA_MENU_NAME.includes('AUTO-QA')) throw new Error('테스트 메뉴 이름에는 AUTO-QA가 필요합니다.');
    const tableNum = Number(env.QA_TABLE_NUM);
    if (!Number.isSafeInteger(tableNum) || tableNum < 1) throw new Error('QA_TABLE_NUM은 양의 정수여야 합니다.');
    orderFlow = { qrPath: qr.pathname, tableSysId: env.QA_TABLE_SYS_ID, tableNum, menuName: env.QA_MENU_NAME };
  }
  return { baseURL: base.origin, accounts, orderFlow };
}

export function assertIdentity(data, account) {
  if (!data || data.userId !== account.id || data.sysPlantCd !== account.store ||
      data.staffRole !== account.role || data.initPwdRequired !== false) {
    throw new Error(`계정/매장/역할/초기 비밀번호 상태 불일치: ${account.label}. 쓰기를 중단합니다.`);
  }
}
