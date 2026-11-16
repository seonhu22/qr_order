import { test, expect } from '@playwright/test';
import process from 'node:process';
import { resolve } from 'node:path';
import { readQaConfig, assertIdentity } from '../scripts/utils/real-qa-env.mjs';
import { runOrderPayment } from './order-payment';

test('실제 계정의 매장/역할과 사용자 관리 권한을 검증한다', async ({ browser }, testInfo) => {
  const config = readQaConfig(resolve(process.env.QA_ENV_FILE ?? '.env.qa.local'));
  const evidence: { account: string; identity: string; listStatus: number; ui: string }[] = [];
  // One test intentionally: any failed login stops all later accounts and avoids lock amplification.
  for (const account of config.accounts) {
    const context = await browser.newContext({ baseURL: config.baseURL, serviceWorkers: 'block' });
    try {
      const page = await context.newPage();
      const errors: number[] = [];
      page.on('response', (response) => {
        if (new URL(response.url()).pathname.startsWith('/api/') && response.status() >= 500) errors.push(response.status());
      });
      // Credentials never enter the browser trace/console or assertion diagnostics.
      const login = await context.request.post('/api/auth/login', {
        data: { userId: account.id, userPassword: account.password },
        timeout: 15_000, maxRetries: 0,
      });
      if (login.status() !== 200 || (await login.json()).success !== true) {
        throw new Error(`${account.label}: 로그인 실패. 재시도하지 않습니다. 계정 상태를 확인하세요.`);
      }
      const me = await context.request.get('/api/auth/me', { timeout: 15_000, maxRetries: 0 });
      if (me.status() !== 200) throw new Error(`${account.label}: 세션 조회 실패`);
      assertIdentity((await me.json()).data, account);
      const list = await context.request.get('/api/client/store_manage/user_manage/search', { timeout: 15_000, maxRetries: 0 });
      expect(list.status(), `${account.label}: 사용자 목록 API 권한`).toBe(account.role === '01' ? 200 : 403);
      if (account.label !== 'manager-a' || !config.orderFlow) {
        await context.route((url) => url.pathname.startsWith('/api/'), async (route) => {
          const req = route.request();
          const path = new URL(req.url()).pathname;
          const audit = ['/api/log/log/menu_open_access_log', '/api/log/log/menu_close_access_log'].includes(path);
          if (req.method() === 'GET' || (req.method() === 'POST' && audit)) return route.fallback();
          errors.push(999); // Unexpected application write; never send to the real server.
          return route.abort('blockedbyclient');
        });
      }
      await page.goto('/client/store/user/management');
      if (account.role === '01') {
        await expect(page.getByRole('region', { name: '유저 정보 관리', exact: true })).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/client\/main$/);
        await expect(page.getByRole('region', { name: '유저 정보 관리', exact: true })).toHaveCount(0);
      }
      expect(errors, `${account.label}: 서버 오류 / 실행 중단`).toEqual([]);
      evidence.push({ account: account.label, identity: '매장/역할 일치', listStatus: list.status(), ui: '통과' });
      if (account.label === 'manager-a' && config.orderFlow) {
        const consumer = await browser.newContext({ baseURL: config.baseURL, serviceWorkers: 'block' });
        await runOrderPayment(consumer, context, account.store, config.orderFlow, testInfo);
      }
    } finally {
      await context.close();
      await testInfo.attach('sanitized-results', { body: JSON.stringify(evidence), contentType: 'application/json' });
    }
  }
});
