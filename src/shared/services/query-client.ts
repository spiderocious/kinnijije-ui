import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api-client';

const MAX_RETRY_COUNT = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Client errors will not succeed on retry.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < MAX_RETRY_COUNT;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
