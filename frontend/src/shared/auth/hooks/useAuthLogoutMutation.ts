import { useQueryClient } from '@tanstack/react-query';
import { useLogout } from '@/generated/logout-controller/logout-controller';
import { queryKeys } from '@/shared/api/queryKeys';

type AuthLogoutMutationOptions = {
  mutation?: {
    onSuccess?: (data: unknown, variables: void, context: unknown) => void;
    onError?: (error: unknown, variables: void, context: unknown) => void;
  };
};

export function useAuthLogoutMutation(options: AuthLogoutMutationOptions = {}) {
  const queryClient = useQueryClient();
  const mutationOptions = options.mutation ?? {};

  return useLogout({
    mutation: {
      ...mutationOptions,
      onSuccess: (data, variables, context) => {
        queryClient.setQueryData(queryKeys.auth.me, {
          success: false,
          data: null,
        });

        mutationOptions.onSuccess?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        queryClient.setQueryData(queryKeys.auth.me, {
          success: false,
          data: null,
        });

        mutationOptions.onError?.(error, variables, context);
      },
    },
  });
}
