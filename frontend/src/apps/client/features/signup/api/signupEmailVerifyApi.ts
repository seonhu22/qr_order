import { useMutation } from '@tanstack/react-query';
import { chkEmailValid } from '@/generated/sign-up-controller/sign-up-controller';
import type { ChkEmailValidParams } from '@/generated/types/chkEmailValidParams';

export type SignupEmailVerifyValidationError = {
  field: 'emailVerifyCode';
  message: string;
};

export function buildSignupEmailVerifyParams(
  email: string,
  validCode: string,
): ChkEmailValidParams | SignupEmailVerifyValidationError {
  const trimmedEmail = email.trim();
  const trimmedValidCode = validCode.trim();

  if (!trimmedValidCode) {
    return { field: 'emailVerifyCode', message: '인증 코드를 입력해주세요.' };
  }

  return { email: trimmedEmail, validCode: trimmedValidCode };
}

export function isSignupEmailVerifyValidationError(
  value: ChkEmailValidParams | SignupEmailVerifyValidationError,
): value is SignupEmailVerifyValidationError {
  return 'field' in value;
}

export function useSignupEmailVerifyMutation() {
  return useMutation({
    mutationFn: (params: ChkEmailValidParams) => chkEmailValid(params),
  });
}
