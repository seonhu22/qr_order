import { mkdirSync, createWriteStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const resultDirectory = resolve(frontendRoot, 'src/test/test-result');
const resultFile = resolve(resultDirectory, 'test-result.log');
const vitestEntry = resolve(frontendRoot, 'node_modules/vitest/vitest.mjs');

mkdirSync(resultDirectory, { recursive: true });

const logStream = createWriteStream(resultFile, { flags: 'w' });
const vitest = spawn(
  process.execPath,
  [vitestEntry, 'run', '--reporter=verbose', ...process.argv.slice(2)],
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

vitest.on('error', (error) => {
  const message = `테스트 실행에 실패했습니다: ${error.message}\n`;
  process.stderr.write(message);
  logStream.end(message, () => {
    process.exitCode = 1;
  });
});

vitest.on('close', (code, signal) => {
  const result = signal
    ? `\n테스트가 ${signal} 신호로 종료되었습니다.\n`
    : `\n테스트 종료 코드: ${code ?? 1}\n`;

  logStream.end(result, () => {
    process.exitCode = signal ? 1 : (code ?? 1);
  });
});
