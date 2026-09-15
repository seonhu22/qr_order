import {
  useReSendUserEmailValid,
  useSendUserEmailValid,
} from '@/generated/email-valid-controller/email-valid-controller';
import type { EmailValidRequest } from '@/generated/types/emailValidRequest';

export type SignupEmailCodeValidationError = {
  field: 'email';
  message: string;
};

export function buildSignupEmailCodeRequest(
  email: string,
): EmailValidRequest | SignupEmailCodeValidationError {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { field: 'email', message: '이메일을 입력해주세요.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { field: 'email', message: '올바른 이메일 형식이 아닙니다.' };
  }

  return { email: trimmedEmail };
}

export function isSignupEmailCodeValidationError(
  value: EmailValidRequest | SignupEmailCodeValidationError,
): value is SignupEmailCodeValidationError {
  return 'field' in value;
}

export function useSignupEmailCodeSendMutation() {
  return useSendUserEmailValid();
}

export function useSignupEmailCodeResendMutation() {
  return useReSendUserEmailValid();
}
