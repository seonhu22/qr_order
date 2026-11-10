import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';

// No shell: arguments remain arguments on Windows and Unix alike.
export function runLoggedCheck(command, args, { cwd, logFile, env }) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const log = createWriteStream(logFile, { flags: 'wx' });
    let child;
    log.once('error', (error) => { child?.kill(); reject(error); });
    log.once('open', () => {
      child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.pipe(log, { end: false });
      child.stderr.pipe(log, { end: false });
      let spawnError;
      child.once('error', (error) => { spawnError = error.message; });
      child.once('close', (code, signal) => {
        const result = { code: spawnError ? 1 : (code ?? 1), signal, error: spawnError, durationMs: Date.now() - started };
        log.end(`\n${JSON.stringify(result)}\n`, () => resolve(result));
      });
    });
  });
}

export function renderVerificationSummary(results, failedTests = []) {
  return [
    '# Frontend verification', '',
    ...results.map((result) => `- ${result.code === 0 ? 'PASS' : 'FAIL'} / ${result.name} / ${(result.durationMs / 1000).toFixed(1)}s / [log](./${result.name}.log)`),
    ...(failedTests.length ? ['', '## Failed tests', ...failedTests.map((name) => `- ${name.replaceAll(/[\r\n]/g, ' ')}`)] : []),
    '', 'Browser evidence: frontend/playwright-report/ and frontend/test-results/e2e/.',
    'Mock browser success does not prove real API/DB persistence.', '',
  ].join('\n');
}

export function extractFailedTests(report) {
  return (report.testResults ?? []).flatMap((file) => {
    const failures = (file.assertionResults ?? []).filter((item) => item.status === 'failed');
    if (failures.length) return failures.map((item) => `${file.name}: ${item.fullName}`);
    return file.status === 'failed' ? [file.name] : [];
  });
}
