import { describe, expect, it } from 'vitest';
import { buildSignupNewUserRequest, isSignupNewUserValidationError } from './signupNewUserApi';

const baseForm = {
  businessNo: '123-45-67890',
  businessRepName: ' 홍길동 ',
  openDate: '2026-06-15',
  signupId: ' client01 ',
  signupPw: 'password1!',
  signupPwConfirm: 'password1!',
  email: ' user@example.com ',
  emailVerifyCode: ' 123456 ',
};

describe('signupNewUserApi', () => {
  it('builds signup request from form values', () => {
    expect(buildSignupNewUserRequest(baseForm)).toEqual({
      businessRegiNum: '1234567890',
      businessRegiDate: '2026-06-15',
      userNm: '홍길동',
      userId: 'client01',
      password: 'password1!',
      passwordChk: 'password1!',
      email: 'user@example.com',
      validCode: '123456',
    });
  });

  it('returns validation error when password confirmation is different', () => {
    const result = buildSignupNewUserRequest({
      ...baseForm,
      signupPwConfirm: 'different',
    });

    expect(isSignupNewUserValidationError(result)).toBe(true);
    expect(result).toEqual({ field: 'signupPw', message: '비밀번호가 일치하지 않습니다.' });
  });

  it('returns validation error when email verify code is empty', () => {
    expect(buildSignupNewUserRequest({ ...baseForm, emailVerifyCode: ' ' })).toEqual({
      field: 'emailVerifyCode',
      message: '이메일 인증을 완료해주세요.',
    });
  });
});
