import { describe, expect, it } from 'vitest';
import {
  buildSignupEmailVerifyParams,
  isSignupEmailVerifyValidationError,
} from './signupEmailVerifyApi';

describe('signupEmailVerifyApi', () => {
  it('builds email verify params with trimmed values', () => {
    expect(buildSignupEmailVerifyParams(' user@example.com ', ' 123456 ')).toEqual({
      email: 'user@example.com',
      validCode: '123456',
    });
  });

  it('returns validation error when valid code is empty', () => {
    const result = buildSignupEmailVerifyParams('user@example.com', ' ');

    expect(isSignupEmailVerifyValidationError(result)).toBe(true);
    expect(result).toEqual({
      field: 'emailVerifyCode',
      message: '인증 코드를 입력해주세요.',
    });
  });
});
