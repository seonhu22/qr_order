import { usePwdChange } from '@/generated/email-valid-controller/email-valid-controller';
import type { EmailValidRequest } from '@/generated/types/emailValidRequest';

export type VerifyPwdChangeValidationError = {
  field: 'validCode';
  message: string;
};

export function buildVerifyPwdChangeRequest(input: {
  email: string;
  validCode: string;
}): EmailValidRequest | VerifyPwdChangeValidationError {
  const trimmedEmail = input.email.trim();
  const trimmedValidCode = input.validCode.trim();

  if (!trimmedValidCode) {
    return { field: 'validCode', message: '인증 코드를 입력해주세요.' };
  }

  return { email: trimmedEmail, validCode: trimmedValidCode };
}

export function isVerifyPwdChangeValidationError(
  value: EmailValidRequest | VerifyPwdChangeValidationError,
): value is VerifyPwdChangeValidationError {
  return 'field' in value;
}

export function useVerifyPwdChangeMutation() {
  return usePwdChange();
}
