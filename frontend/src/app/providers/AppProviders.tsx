import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

function shouldRetryRequest(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;

  if (status && status < 500) {
    return false;
  }

  return failureCount < 1;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryRequest,
      staleTime: 60_000
    }
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
