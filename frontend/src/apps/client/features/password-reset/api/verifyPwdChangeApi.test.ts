import { describe, expect, it } from 'vitest';
import {
  buildVerifyPwdChangeRequest,
  isVerifyPwdChangeValidationError,
} from './verifyPwdChangeApi';

describe('verifyPwdChangeApi', () => {
  it('builds request with trimmed email and validCode', () => {
    expect(
      buildVerifyPwdChangeRequest({ email: ' user@example.com ', validCode: ' 123456 ' }),
    ).toEqual({ email: 'user@example.com', validCode: '123456' });
  });

  it('returns validation error when validCode is empty', () => {
    const result = buildVerifyPwdChangeRequest({ email: 'user@example.com', validCode: ' ' });

    expect(isVerifyPwdChangeValidationError(result)).toBe(true);
    expect(result).toEqual({ field: 'validCode', message: '인증 코드를 입력해주세요.' });
  });
});
