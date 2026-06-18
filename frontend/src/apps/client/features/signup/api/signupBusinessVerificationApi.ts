import { useChkBRN } from '@/generated/sign-up-controller/sign-up-controller';
import type { ChkBRNMutationResult } from '@/generated/sign-up-controller/sign-up-controller';
import { HttpError } from '@/shared/lib/httpClient';

export type SignupBusinessVerificationForm = {
  businessNo: string;
  businessRepName: string;
  openDate: string;
};

export type SignupBusinessVerificationPayload = {
  businessRegiNum: string;
  userNm: string;
  businessRegiDate: string;
};

export type SignupBusinessVerificationError =
  | { field: 'businessNo'; message: string }
  | { field: 'businessRepName'; message: string }
  | { field: 'openDate'; message: string };

type SignupBusinessVerificationMutationOptions = {
  mutation?: {
    onSuccess?: (
      data: ChkBRNMutationResult,
      variables: { data: SignupBusinessVerificationPayload },
      context: unknown,
    ) => void | Promise<void>;
    onError?: (error: unknown) => void;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

export function buildSignupBusinessVerificationPayload(
  form: SignupBusinessVerificationForm,
): SignupBusinessVerificationPayload | SignupBusinessVerificationError {
  const digits = form.businessNo.replace(/\D/g, '');
  const businessRepName = form.businessRepName.trim();

  if (digits.length !== 10) {
    return { field: 'businessNo', message: '사업자등록번호 10자리를 입력해주세요.' };
  }

  if (!businessRepName) {
    return { field: 'businessRepName', message: '대표자명을 입력해주세요.' };
  }

  if (!form.openDate) {
    return { field: 'openDate', message: '개업일을 선택해주세요.' };
  }

  return {
    businessRegiNum: digits,
    userNm: businessRepName,
    businessRegiDate: form.openDate,
  };
}

export function isSignupBusinessVerificationError(
  value: SignupBusinessVerificationPayload | SignupBusinessVerificationError,
): value is SignupBusinessVerificationError {
  return 'field' in value;
}

export function getSignupBusinessVerificationErrorMessage(error: unknown): string {
  if (
    error instanceof HttpError &&
    isRecord(error.payload) &&
    typeof error.payload.message === 'string' &&
    error.payload.message.trim()
  ) {
    return error.payload.message;
  }

  if (error instanceof HttpError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.';
}

export function useSignupBusinessVerificationMutation(
  options: SignupBusinessVerificationMutationOptions = {},
) {
  const mutationOptions = options.mutation ?? {};

  return useChkBRN({
    mutation: {
      ...mutationOptions,
      onSuccess: async (data, variables, context) => {
        await mutationOptions.onSuccess?.(
          data,
          variables as { data: SignupBusinessVerificationPayload },
          context,
        );
      },
      onError: (error) => {
        mutationOptions.onError?.(error);
      },
    },
  });
}
