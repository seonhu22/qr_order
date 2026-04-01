// src/shared/auth/hooks/useAuthLoginMutation.ts

import { useQueryClient } from '@tanstack/react-query';
import { useLogin } from '@/generated/login-controller/login-controller';
import type { LoginMutationResult } from '@/generated/login-controller/login-controller';
import { queryKeys } from '@/shared/api/queryKeys';

type AuthLoginMutationOptions = {
  mutation?: {
    onSuccess?: (
      data: LoginMutationResult,
      variables: { data: { userId: string; userPassword: string } },
      context: unknown,
    ) => void;
    onError?: (error: unknown) => void;
  };
};

export function useAuthLoginMutation(options: AuthLoginMutationOptions = {}) {
  const queryClient = useQueryClient();
  const mutationOptions = options?.mutation ?? {};

  return useLogin({
    mutation: {
      ...mutationOptions,
      onSuccess: (data, variables, context) => {
        if (data?.success) {
          queryClient.setQueryData(queryKeys.auth.me, data);
        }

        mutationOptions.onSuccess?.(data, variables, context);
      },
      onError: (error) => {
        mutationOptions.onError?.(error);
      },
    },
  });
}
