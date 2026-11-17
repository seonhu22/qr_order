import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import console from 'node:console';
import process from 'node:process';
import { readQaConfig } from './utils/real-qa-env.mjs';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const option = args.indexOf('--env-file');
const file = option >= 0 ? args[option + 1] : '.env.qa.local';
if (!file || (args.length && (option !== 0 || args.length !== 2))) {
  console.error('사용법: npm run test:qa:real -- [--env-file 파일경로]');
  process.exit(1);
}
try {
  const envFile = resolve(cwd, file);
  const config = readQaConfig(envFile);
  if (process.env.QA_RESUME_ORDER_ID && (!config.orderFlow || !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(process.env.QA_RESUME_ORDER_ID))) {
    throw new Error('기존 주문 재개에는 주문/결제 설정과 올바른 QA_RESUME_ORDER_ID가 필요합니다.');
  }
  console.log(`실제 서버 QA: 계정 ${config.accounts.length}개 / workers=1 / retries=0 / 로그인 계정당 최대 1회`);
  console.log(config.orderFlow
    ? process.env.QA_RESUME_ORDER_ID
      ? '쓰기 실행 안내: 지정한 기존 접수 주문의 조리/서빙/카드 결제 각 1회. 신규 주문과 DB 초기화는 없습니다.'
      : '쓰기 실행 안내: AUTO-QA 메뉴 1개 주문/조리/서빙/카드 결제 각 1회. 데이터가 남습니다. DB 초기화는 없습니다.'
    : '이번 실행은 로그인과 조회/권한 차단 검증입니다. 주문/결제/DB 초기화는 실행하지 않습니다.');
  console.log('로그인 실패나 5xx/15초 초과 시 즉시 중단합니다. 자동 로그인 재시도는 없습니다.');
  const preflight = await globalThis.fetch(`${config.baseURL}/api/auth/me`, { signal: globalThis.AbortSignal.timeout(5000), redirect: 'error' });
  if (![200, 401].includes(preflight.status) || !preflight.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`백엔드 사전 연결 검사 실패(HTTP ${preflight.status}). 로그인 요청 없이 중단합니다.`);
  }
  const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
  const child = spawn(process.execPath, [cli, 'test', '--config=playwright.real.config.ts'], {
    cwd, stdio: 'inherit', env: { ...process.env, QA_ENV_FILE: envFile },
  });
  child.on('error', () => { console.error('Playwright 실행 실패. npm ci와 Chromium 설치를 확인하세요.'); process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
} catch (error) {
  console.error(error.code === 'ENOENT' ? 'QA 환경변수 파일이 없습니다. --env-file로 지정하세요.' : error.message);
  process.exitCode = 1;
}
