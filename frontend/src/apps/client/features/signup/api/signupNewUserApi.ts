import { useNewUser } from '@/generated/sign-up-controller/sign-up-controller';
import type { SignUpRequest } from '@/generated/types/signUpRequest';

export type SignupNewUserForm = {
  businessNo: string;
  businessRepName: string;
  openDate: string;
  signupId: string;
  signupPw: string;
  signupPwConfirm: string;
  email: string;
  emailVerifyCode: string;
};

export type SignupNewUserValidationError =
  | { field: 'signupId'; message: string }
  | { field: 'signupPw'; message: string }
  | { field: 'email'; message: string }
  | { field: 'emailVerifyCode'; message: string };

type BuildSignupNewUserRequestOptions = {
  businessVerificationBypassed?: boolean;
};

export function buildSignupNewUserRequest(
  form: SignupNewUserForm,
  options: BuildSignupNewUserRequestOptions = {},
): SignUpRequest | SignupNewUserValidationError {
  const businessRegiNum = form.businessNo.replace(/\D/g, '');
  const userNm = form.businessRepName.trim();
  const userId = form.signupId.trim();
  const email = form.email.trim();
  const validCode = form.emailVerifyCode.trim();

  if (!userId) {
    return { field: 'signupId', message: '아이디를 입력해주세요.' };
  }

  if (!form.signupPw || !form.signupPwConfirm) {
    return { field: 'signupPw', message: '비밀번호를 입력해주세요.' };
  }

  if (form.signupPw !== form.signupPwConfirm) {
    return { field: 'signupPw', message: '비밀번호가 일치하지 않습니다.' };
  }

  if (!email) {
    return { field: 'email', message: '이메일을 입력해주세요.' };
  }

  if (!validCode) {
    return { field: 'emailVerifyCode', message: '이메일 인증을 완료해주세요.' };
  }

  const request: SignUpRequest = {
    businessRegiNum,
    businessRegiDate: form.openDate,
    userNm,
    userId,
    password: form.signupPw,
    passwordChk: form.signupPwConfirm,
    email,
    validCode,
  };

  if (options.businessVerificationBypassed) {
    request.plantNm = `${userNm}컴퍼니`;
  }

  return request;
}

export function isSignupNewUserValidationError(
  value: SignUpRequest | SignupNewUserValidationError,
): value is SignupNewUserValidationError {
  return 'field' in value;
}

export function useSignupNewUserMutation() {
  return useNewUser();
}
