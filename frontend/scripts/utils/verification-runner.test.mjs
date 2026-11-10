import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runLoggedCheck, renderVerificationSummary, extractFailedTests } from './verification-runner.mjs';

test('captures both streams and preserves a failing exit code', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'qr-verify-'));
  try {
    const logFile = join(directory, 'check.log');
    const result = await runLoggedCheck(process.execPath, ['-e', 'console.log("out");console.error("err");process.exitCode=7'], { logFile });
    assert.equal(result.code, 7);
    const log = readFileSync(logFile, 'utf8');
    assert.match(log, /out/);
    assert.match(log, /err/);
    assert.match(renderVerificationSummary([{ name: 'test', ...result }]), /FAIL \/ test/);
  } finally { rmSync(directory, { recursive: true }); }
});

test('reports missing executable as failure and success as PASS', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'qr-verify-'));
  try {
    const failed = await runLoggedCheck(join(directory, 'missing-executable'), [], { logFile: join(directory, 'fail.log') });
    assert.equal(failed.code, 1);
    assert.ok(failed.error);
    const passed = await runLoggedCheck(process.execPath, ['-e', 'process.exitCode=0'], { logFile: join(directory, 'pass.log') });
    assert.equal(passed.code, 0);
    assert.match(renderVerificationSummary([{ name: 'test', ...passed }]), /PASS \/ test/);
  } finally { rmSync(directory, { recursive: true }); }
});

test('summary lists failed assertions and collection failures without dumping full logs', () => {
  const failures = extractFailedTests({ testResults: [
    { name: 'a.test.ts', status: 'failed', assertionResults: [{ status: 'failed', fullName: 'retry preserves ID' }, { status: 'passed', fullName: 'ok' }] },
    { name: 'b.test.ts', status: 'failed', assertionResults: [] },
    { name: 'c.test.ts', status: 'passed', assertionResults: [] },
  ] });
  assert.deepEqual(failures, ['a.test.ts: retry preserves ID', 'b.test.ts']);
  assert.match(renderVerificationSummary([], failures), /## Failed tests/);
});

test('CI summary persists failures and rejects skipped checks', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'qr-ci-summary-'));
  try {
    const summaryFile = join(directory, 'summary.md');
    const result = await runLoggedCheck(process.execPath, [fileURLToPath(new URL('../write-ci-summary.mjs', import.meta.url))], {
      logFile: join(directory, 'ci.log'),
      env: { ...process.env, CHECK_RESULTS: JSON.stringify({ unit: { result: 'failure' }, browser: { result: 'skipped' } }), GITHUB_STEP_SUMMARY: summaryFile, CI_RUN_URL: 'https://example.com/run/1' },
    });
    assert.equal(result.code, 1);
    assert.match(readFileSync(summaryFile, 'utf8'), /unit \/ failure/);
    assert.match(readFileSync(summaryFile, 'utf8'), /browser \/ skipped/);
  } finally { rmSync(directory, { recursive: true }); }
});
