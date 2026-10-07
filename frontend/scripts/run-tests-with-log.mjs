import { createWriteStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createTestLogFile } from './utils/test-log-file.mjs';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const resultFile = createTestLogFile(frontendRoot);
const vitestEntry = resolve(frontendRoot, 'node_modules/vitest/vitest.mjs');
const vitestArguments = process.argv.slice(2);

process.stdout.write(`테스트 로그: ${resultFile}\n`);

const logStream = createWriteStream(resultFile, { flags: 'w' });
const vitest = spawn(
  process.execPath,
  [vitestEntry, 'run', ...vitestArguments],
  {
    cwd: frontendRoot,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  },
);

const copyOutput = (output, terminal) => {
  output.on('data', (chunk) => {
    terminal.write(chunk);
    logStream.write(chunk);
  });
};

copyOutput(vitest.stdout, process.stdout);
copyOutput(vitest.stderr, process.stderr);

let finished = false;

const finish = (message, exitCode) => {
  if (finished) return;
  finished = true;
  logStream.end(message, () => {
    process.exitCode = exitCode;
  });
};

vitest.once('error', (error) => {
  const message = `테스트 실행에 실패했습니다: ${error.message}\n`;
  process.stderr.write(message);
  finish(message, 1);
});

vitest.once('close', (code, signal) => {
  const result = signal
    ? `\n테스트가 ${signal} 신호로 종료되었습니다.\n`
    : `\n테스트 종료 코드: ${code ?? 1}\n`;

  finish(result, signal ? 1 : (code ?? 1));
});
