import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readQaConfig, assertIdentity } from './real-qa-env.mjs';

const valid = {
  QA_BASE_URL: 'http://localhost:3000', QA_STORE_A_CODE: 'QA-A',
  QA_MANAGER_A_ID: 'manager', QA_MANAGER_A_PASSWORD: 'not-a-real-password',
  QA_STAFF_A_ID: 'staff', QA_STAFF_A_PASSWORD: 'not-a-real-password',
};
function config(patch = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'qr-qa-config-'));
  try {
    const file = join(dir, '.env');
    writeFileSync(file, '# independent test fixture\n');
    return readQaConfig(file, { ...valid, ...patch });
  } finally { rmSync(dir, { recursive: true }); }
}
test('A매장 관리자와 스태프를 구성한다', () => {
  assert.equal(config().accounts.length, 2);
});
test('필수값 누락 오류는 비밀번호를 노출하지 않는다', () => {
  assert.throws(() => config({ QA_STAFF_A_ID: '' }), /QA_STAFF_A_ID/);
});
test('B매장 부분 입력과 같은 매장 설정을 거부한다', () => {
  assert.throws(() => config({ QA_STORE_B_CODE: 'B' }), /모두/);
  assert.throws(() => config({ QA_STORE_B_CODE: 'QA-A', QA_MANAGER_B_ID: 'b', QA_MANAGER_B_PASSWORD: 'x' }), /달라야/);
});
test('인증정보/경로가 포함된 서버 주소를 거부한다', () => {
  for (const url of ['http://id:secret@localhost', 'http://localhost/client', 'file:///tmp']) {
    assert.throws(() => config({ QA_BASE_URL: url }));
  }
});
test('중복 아이디라도 실제 매장/역할/강제변경 상태가 다르면 중단한다', () => {
  const account = config().accounts[0];
  const data = { userId: account.id, sysPlantCd: account.store, staffRole: '01', initPwdRequired: false };
  assertIdentity(data, account);
  for (const change of [{ sysPlantCd: 'B' }, { staffRole: '02' }, { userId: 'other' }, { initPwdRequired: true }, { initPwdRequired: undefined }]) {
    assert.throws(() => assertIdentity({ ...data, ...change }, account), /불일치/);
  }
});
test('주문/결제는 기본 비활성이고 명시적 입력 없이는 실행할 수 없다', () => {
  assert.equal(config().orderFlow, null);
  assert.throws(() => config({ QA_ENABLE_ORDER_PAYMENT: '1' }), /준비값 누락/);
  const flow = { QA_ENABLE_ORDER_PAYMENT: '1', QA_QR_URL: '/qr/test', QA_TABLE_SYS_ID: 'T', QA_TABLE_NUM: '5', QA_MENU_NAME: 'AUTO-QA 메뉴' };
  assert.equal(config(flow).orderFlow.tableNum, 5);
  assert.throws(() => config({ ...flow, QA_MENU_NAME: '일반 메뉴' }), /AUTO-QA/);
  assert.throws(() => config({ ...flow, QA_QR_URL: 'http://other/qr/test' }), /같은 서버/);
});
