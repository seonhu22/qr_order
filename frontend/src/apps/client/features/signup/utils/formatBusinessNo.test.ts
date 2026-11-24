import { expect, it } from 'vitest';
import { formatBusinessNo } from './formatBusinessNo';

describe('formatBusinessNo', () => {
  it('10자리는 3-2-5로 나눔', () => {
    expect(formatBusinessNo('1234567890')).toBe('123-45-67890');
  });
  it('숫자가 아닌 글자는 지움', () => {
    expect(formatBusinessNo('asdfghjklo1234567890')).toBe('123-45-67890');
  });
  it('10자리가 넘으면 자른다', () => {
    expect(formatBusinessNo('12345678900000')).toBe('123-45-67890');
  });
});
