import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const pad = (value, length = 2) => String(value).padStart(length, '0');

export function formatTestLogTimestamp(date = new Date()) {
  const day = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
  const time = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join('');

  return `${day}-${time}-${pad(date.getMilliseconds(), 3)}`;
}

export function createTestLogFile(frontendRoot, date = new Date()) {
  const resultDirectory = resolve(frontendRoot, 'src/test/test-result');
  mkdirSync(resultDirectory, { recursive: true });

  return resolve(resultDirectory, `test-result-${formatTestLogTimestamp(date)}.log`);
}
