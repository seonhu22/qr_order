import { QueryClient } from '@tanstack/react-query';
import { staleTimes } from '@/shared/api/queryPolicies';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: staleTimes.normal,
    },
  },
});
