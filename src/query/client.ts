import { QueryClient } from '@tanstack/react-query';

/**
 * Single QueryClient for the app.
 * - Default staleTime: 60s (departures-appropriate; static queries override).
 * - gcTime: 5 minutes.
 * - retry: 3 (exponential backoff; TanStack only retries on errors by default).
 * - No aggressive polling or refetch-on-focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});