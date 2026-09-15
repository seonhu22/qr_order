import { describe, expect, it } from 'vitest';
import {
  buildSendPwdChangeCodeRequest,
  isSendPwdChangeCodeValidationError,
} from './sendPwdChangeCodeApi';

describe('sendPwdChangeCodeApi', () => {
  it('builds request with trimmed userId and email', () => {
    expect(
      buildSendPwdChangeCodeRequest({ userId: '  hong  ', email: ' user@example.com ' }),
    ).toEqual({ userId: 'hong', email: 'user@example.com' });
  });

  it('returns validation error when userId is empty', () => {
    const result = buildSendPwdChangeCodeRequest({ userId: '  ', email: 'user@example.com' });

    expect(isSendPwdChangeCodeValidationError(result)).toBe(true);
    expect(result).toEqual({ field: 'userId', message: '아이디를 입력해주세요.' });
  });

  it('returns validation error when email is empty', () => {
    expect(buildSendPwdChangeCodeRequest({ userId: 'hong', email: '   ' })).toEqual({
      field: 'email',
      message: '이메일을 입력해주세요.',
    });
  });

  it('returns validation error when email format is invalid', () => {
    expect(buildSendPwdChangeCodeRequest({ userId: 'hong', email: 'invalid-email' })).toEqual({
      field: 'email',
      message: '올바른 이메일 형식이 아닙니다.',
    });
  });
});
