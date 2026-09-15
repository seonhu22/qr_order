import { describe, expect, it } from 'vitest';
import { validatePasswordPair } from './validatePasswordPair';

describe('validatePasswordPair', () => {
  it('requires both password values', () => {
    expect(validatePasswordPair('', '1234')).toEqual({
      ok: false,
      message: '비밀번호를 입력해주세요.',
    });
  });

  it('requires matching password values', () => {
    expect(validatePasswordPair('1234', '5678')).toEqual({
      ok: false,
      message: '비밀번호가 일치하지 않습니다.',
    });
  });

  it('accepts matching password values', () => {
    expect(validatePasswordPair('1234', '1234')).toEqual({ ok: true });
  });
});
