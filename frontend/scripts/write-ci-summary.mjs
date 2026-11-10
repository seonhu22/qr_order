import { appendFileSync } from 'node:fs';
import process from 'node:process';

const checks = JSON.parse(process.env.CHECK_RESULTS ?? '{}');
const rows = Object.entries(checks).map(([name, job]) => `- ${job.result === 'success' ? 'PASS' : 'CHECK'} / ${name} / ${job.result}`);
const summary = [
  '# CI verification', '', ...rows, '',
  `[Job logs and downloadable evidence](${process.env.CI_RUN_URL})`, '',
  'Artifacts: frontend-unit-evidence / browser-failure-evidence.',
  'Mock browser tests do not prove real API/DB persistence.', '',
].join('\n');
process.stdout.write(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.exitCode = Object.values(checks).some((job) => job.result !== 'success') ? 1 : 0;
