import { readFileSync, appendFileSync } from 'node:fs';
import process from 'node:process';
import { extractFailedTests } from './utils/verification-runner.mjs';

let summary;
try {
  const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const failures = extractFailedTests(report);
  summary = ['## Frontend unit tests', '',
    `Passed: ${report.numPassedTests} / Failed: ${report.numFailedTests} / Pending: ${report.numPendingTests}`,
    ...failures.map((name) => `- ${name.replaceAll(/[\r\n]/g, ' ')}`), '',
    'Full logs and JSON: frontend-unit-evidence artifact.', '',
  ].join('\n');
  process.exitCode = report.success === true ? 0 : 1;
} catch {
  summary = '## Frontend unit tests\n\nStructured test evidence is unavailable. Inspect earlier job steps.\n';
  process.exitCode = 1;
}
process.stdout.write(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
