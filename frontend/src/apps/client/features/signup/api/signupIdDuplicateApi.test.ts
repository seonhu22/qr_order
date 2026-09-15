import { describe, expect, it } from 'vitest';
import {
  buildSignupIdDuplicateParams,
  isSignupIdDuplicateValidationError,
  mapIdDuplicateResult,
} from './signupIdDuplicateApi';

describe('signupIdDuplicateApi', () => {
  it('builds id duplicate params with trimmed user id', () => {
    expect(buildSignupIdDuplicateParams(' client01 ')).toEqual({ userId: 'client01' });
  });

  it('returns validation error when user id is empty', () => {
    const result = buildSignupIdDuplicateParams(' ');

    expect(isSignupIdDuplicateValidationError(result)).toBe(true);
    expect(result).toEqual({ field: 'signupId', message: '아이디를 입력해주세요.' });
  });

  it('maps backend true to taken because it means duplicated', () => {
    expect(mapIdDuplicateResult(true)).toBe('taken');
    expect(mapIdDuplicateResult(false)).toBe('available');
  });
});
