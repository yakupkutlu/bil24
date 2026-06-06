import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';
import { ToastProvider } from '@/components/ui/ToastProvider';

export function AppProviders({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              if (error?.status === 401 || error?.status === 403 || error?.status === 404) return false;
              return failureCount < 1;
            },
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false
          },
          mutations: { retry: false }
        }
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
