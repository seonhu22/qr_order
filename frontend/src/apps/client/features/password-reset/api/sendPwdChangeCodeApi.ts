import {
  useReSendPwdChangeCode,
  useSendPwdChangeCode,
} from '@/generated/email-valid-controller/email-valid-controller';
import type { EmailValidRequest } from '@/generated/types/emailValidRequest';

export type SendPwdChangeCodeValidationError = {
  field: 'userId' | 'email';
  message: string;
};

export function buildSendPwdChangeCodeRequest(input: {
  userId: string;
  email: string;
}): EmailValidRequest | SendPwdChangeCodeValidationError {
  const trimmedUserId = input.userId.trim();
  const trimmedEmail = input.email.trim();

  if (!trimmedUserId) {
    return { field: 'userId', message: '아이디를 입력해주세요.' };
  }

  if (!trimmedEmail) {
    return { field: 'email', message: '이메일을 입력해주세요.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { field: 'email', message: '올바른 이메일 형식이 아닙니다.' };
  }

  return { userId: trimmedUserId, email: trimmedEmail };
}

export function isSendPwdChangeCodeValidationError(
  value: EmailValidRequest | SendPwdChangeCodeValidationError,
): value is SendPwdChangeCodeValidationError {
  return 'field' in value;
}

export function useSendPwdChangeCodeMutation() {
  return useSendPwdChangeCode();
}

export function useReSendPwdChangeCodeMutation() {
  return useReSendPwdChangeCode();
}
