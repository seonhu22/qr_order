import { useChangePwd } from '@/generated/pwd-chg-controller/pwd-chg-controller';
import type { PwdChgRequest } from '@/generated/types/pwdChgRequest';

export type ChangePwdValidationError = {
  field: 'userId' | 'pwd' | 'pwdConfirm';
  message: string;
};

export function buildChangePwdRequest(input: {
  userId: string;
  pwd: string;
  pwdConfirm: string;
}): PwdChgRequest | ChangePwdValidationError {
  const trimmedUserId = input.userId.trim();

  if (!trimmedUserId) {
    return { field: 'userId', message: '아이디를 확인할 수 없습니다.' };
  }

  if (!input.pwd) {
    return { field: 'pwd', message: '새 비밀번호를 입력해주세요.' };
  }

  if (!input.pwdConfirm) {
    return { field: 'pwdConfirm', message: '비밀번호 확인을 입력해주세요.' };
  }

  if (input.pwd !== input.pwdConfirm) {
    return { field: 'pwdConfirm', message: '비밀번호가 일치하지 않습니다.' };
  }

  return { userId: trimmedUserId, pwd: input.pwd, pwdConfirm: input.pwdConfirm };
}

export function isChangePwdValidationError(
  value: PwdChgRequest | ChangePwdValidationError,
): value is ChangePwdValidationError {
  return 'field' in value;
}

export function useChangePwdMutation() {
  return useChangePwd();
}
