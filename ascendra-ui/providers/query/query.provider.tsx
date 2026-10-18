'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { isApiError } from '@/ascendra-ui/lib/api';

/** A 4xx (not signed in, no permission, not found, invalid) won't change on a retry — show it at once. */
const isClientError = (error: unknown) => isApiError(error) && error.status >= 400 && error.status < 500;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,     // 1 minute
            // One more try for a network blip or a 5xx; none for a 4xx.
            retry: (failureCount, error) => failureCount < 1 && !isClientError(error),
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
