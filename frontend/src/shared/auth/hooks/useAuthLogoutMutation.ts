import { useQueryClient } from '@tanstack/react-query';
import { useLogout } from '@/generated/logout-controller/logout-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  beginAuthTransition,
  endAuthTransition,
} from '@/shared/auth/authTransition';

type AuthLogoutMutationOptions = {
  mutation?: {
    onSuccess?: (data: unknown, variables: void, context: unknown) => void;
    onError?: (error: unknown, variables: void, context: unknown) => void;
  };
};

export function useAuthLogoutMutation(options: AuthLogoutMutationOptions = {}) {
  const queryClient = useQueryClient();
  const mutationOptions = options.mutation ?? {};

  const clearSessionCache = async () => {
    try {
      await queryClient.cancelQueries();
      queryClient.setQueryData(queryKeys.auth.me, {
        success: false,
        data: null,
      });
      queryClient.removeQueries({
        predicate: (query) =>
          JSON.stringify(query.queryKey) !== JSON.stringify(queryKeys.auth.me),
      });
    } finally {
      endAuthTransition();
    }
  };

  return useLogout({
    mutation: {
      ...mutationOptions,
      onMutate: () => {
        beginAuthTransition();
      },
      onSuccess: async (data, variables, context) => {
        await clearSessionCache();

        mutationOptions.onSuccess?.(data, variables, context);
      },
      onError: async (error, variables, context) => {
        await clearSessionCache();

        mutationOptions.onError?.(error, variables, context);
      },
    },
  });
}
