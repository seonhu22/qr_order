import { describe, expect, it } from 'vitest';
import {
  buildSignupEmailCodeRequest,
  isSignupEmailCodeValidationError,
} from './signupEmailCodeApi';

describe('signupEmailCodeApi', () => {
  it('builds email code request with trimmed email', () => {
    expect(buildSignupEmailCodeRequest(' user@example.com ')).toEqual({
      email: 'user@example.com',
    });
  });

  it('returns validation error when email is empty', () => {
    const result = buildSignupEmailCodeRequest(' ');

    expect(isSignupEmailCodeValidationError(result)).toBe(true);
    expect(result).toEqual({ field: 'email', message: '이메일을 입력해주세요.' });
  });

  it('returns validation error when email format is invalid', () => {
    expect(buildSignupEmailCodeRequest('invalid-email')).toEqual({
      field: 'email',
      message: '올바른 이메일 형식이 아닙니다.',
    });
  });
});
