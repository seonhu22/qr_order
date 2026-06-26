import { describe, expect, it } from 'vitest';
import { buildChangePwdRequest, isChangePwdValidationError } from './changePwdApi';

describe('changePwdApi', () => {
  it('builds request with trimmed userId', () => {
    expect(
      buildChangePwdRequest({ userId: '  hong  ', pwd: 'abc1234!', pwdConfirm: 'abc1234!' }),
    ).toEqual({ userId: 'hong', pwd: 'abc1234!', pwdConfirm: 'abc1234!' });
  });

  it('returns validation error when userId is empty', () => {
    const result = buildChangePwdRequest({ userId: '  ', pwd: 'a', pwdConfirm: 'a' });

    expect(isChangePwdValidationError(result)).toBe(true);
    expect(result).toEqual({ field: 'userId', message: '아이디를 확인할 수 없습니다.' });
  });

  it('returns validation error when pwd is empty', () => {
    expect(buildChangePwdRequest({ userId: 'hong', pwd: '', pwdConfirm: 'a' })).toEqual({
      field: 'pwd',
      message: '새 비밀번호를 입력해주세요.',
    });
  });

  it('returns validation error when pwdConfirm is empty', () => {
    expect(buildChangePwdRequest({ userId: 'hong', pwd: 'a', pwdConfirm: '' })).toEqual({
      field: 'pwdConfirm',
      message: '비밀번호 확인을 입력해주세요.',
    });
  });

  it('returns validation error when pwd and pwdConfirm differ', () => {
    expect(
      buildChangePwdRequest({ userId: 'hong', pwd: 'abc1234!', pwdConfirm: 'xyz9999!' }),
    ).toEqual({ field: 'pwdConfirm', message: '비밀번호가 일치하지 않습니다.' });
  });
});
