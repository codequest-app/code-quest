import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { toast } from 'sonner';

function isServerError(error: unknown): boolean {
  return error instanceof HTTPError && error.response.status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isServerError(error)) return false;
        return failureCount < 3;
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message || 'An unexpected error occurred');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error.message || 'An unexpected error occurred');
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const message = (mutation.meta as Record<string, unknown> | undefined)?.successMessage;
      if (typeof message === 'string') {
        toast.success(message);
      }
    },
  }),
});
