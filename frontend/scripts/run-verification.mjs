import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { formatTestLogTimestamp } from './utils/test-log-file.mjs';
import { runLoggedCheck, renderVerificationSummary, extractFailedTests } from './utils/verification-runner.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'src/test/test-result', `verify-${formatTestLogTimestamp()}-${process.pid}`);
mkdirSync(output, { recursive: true });
const checks = [
  ['script-tests', ['test:scripts']],
  ['typecheck', ['typecheck']],
  ['lint', ['lint']],
  ['unit-tests', ['test', '--', '--maxWorkers=2', '--reporter=default', '--reporter=json', `--outputFile=${resolve(output, 'vitest.json')}`]],
  ['browser-typecheck', ['test:e2e:typecheck']],
  ['browser-tests', ['test:e2e']],
  ['build', ['build']],
];
const results = [];
let failedTests = [];
if (!process.env.npm_execpath) throw new Error('Run through npm run verify.');
process.stdout.write(`Verification logs: ${output}\n`);
for (const [name, args] of checks) {
  process.stdout.write(`RUN / ${name}\n`);
  const result = await runLoggedCheck(process.execPath, [process.env.npm_execpath, 'run', ...args], {
    cwd: root, logFile: resolve(output, `${name}.log`), env: process.env,
  });
  results.push({ name, ...result });
  if (name === 'unit-tests' && existsSync(resolve(output, 'vitest.json'))) {
    try { failedTests = extractFailedTests(JSON.parse(readFileSync(resolve(output, 'vitest.json'), 'utf8'))); }
    catch { failedTests = ['JSON report unreadable; inspect unit-tests.log.']; }
  }
  // Persist after each check so interrupted runs still retain completed evidence.
  writeFileSync(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
  writeFileSync(resolve(output, 'summary.md'), renderVerificationSummary(results, failedTests));
  process.stdout.write(`${result.code === 0 ? 'PASS' : 'FAIL'} / ${name}\n`);
}
const summary = renderVerificationSummary(results, failedTests);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.replaceAll(/\[log\]\([^)]*\)/g, 'see verification-evidence artifact'));
}
process.stdout.write(`Summary: ${resolve(output, 'summary.md')}\n`);
process.exitCode = results.some((result) => result.code !== 0) ? 1 : 0;
