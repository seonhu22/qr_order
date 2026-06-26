import { useMutation } from '@tanstack/react-query';
import { idDuplicateChk } from '@/generated/sign-up-controller/sign-up-controller';
import type { IdDuplicateChkParams } from '@/generated/types/idDuplicateChkParams';

export type SignupIdDuplicateStatus = 'available' | 'taken';

export type SignupIdDuplicateValidationError = {
  field: 'signupId';
  message: string;
};

export function buildSignupIdDuplicateParams(
  userId: string,
): IdDuplicateChkParams | SignupIdDuplicateValidationError {
  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    return { field: 'signupId', message: '아이디를 입력해주세요.' };
  }

  return { userId: trimmedUserId };
}

export function isSignupIdDuplicateValidationError(
  value: IdDuplicateChkParams | SignupIdDuplicateValidationError,
): value is SignupIdDuplicateValidationError {
  return 'field' in value;
}

export function mapIdDuplicateResult(isDuplicated: boolean): SignupIdDuplicateStatus {
  return isDuplicated ? 'taken' : 'available';
}

export function useSignupIdDuplicateMutation() {
  return useMutation({
    mutationFn: (params: IdDuplicateChkParams) => idDuplicateChk(params),
  });
}
