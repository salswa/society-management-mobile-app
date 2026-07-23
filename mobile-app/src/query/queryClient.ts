import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (failureCount, error) => {
        // Don't retry auth/permission/validation errors.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
