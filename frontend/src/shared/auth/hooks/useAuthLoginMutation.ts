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
    ) => void | Promise<void>;
    onError?: (error: unknown) => void;
  };
};

export function useAuthLoginMutation(options: AuthLoginMutationOptions = {}) {
  const queryClient = useQueryClient();
  const mutationOptions = options?.mutation ?? {};

  return useLogin({
    mutation: {
      ...mutationOptions,
      onSuccess: async (data, variables, context) => {
        if (data?.success) {
          queryClient.setQueryData(queryKeys.auth.me, data);
          // void는 TypeScript에서 반환값이 없는 함수를 나타내는 타입입니다. 여기서는 invalidateQueries가 반환하는 Promise를 무시하기 위해 사용됩니다.
          void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
        } else {
          queryClient.setQueryData(queryKeys.auth.me, {
            success: false,
            data: null,
          });
        }

        await mutationOptions.onSuccess?.(data, variables, context);
      },
      onError: (error) => {
        mutationOptions.onError?.(error);
      },
    },
  });
}
