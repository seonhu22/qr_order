// src/shared/auth/hooks/useAuthLoginMutation.ts

import { useQueryClient } from '@tanstack/react-query';
import { useLogin } from '@/generated/login-controller/login-controller';
import { queryKeys } from '@/shared/api/queryKeys';

type UseLoginOptions = Parameters<typeof useLogin>[0];

export function useAuthLoginMutation(options: UseLoginOptions = {}) {
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
    },
  });
}
