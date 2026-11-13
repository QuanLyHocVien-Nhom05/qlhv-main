'use client';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '@/features/auth/session-provider';
export function Providers({children}: {children: ReactNode}) {
  const [client] = useState(() => new QueryClient({defaultOptions: {queries: {retry: false, refetchOnWindowFocus: false}}}));
  return <QueryClientProvider client={client}><SessionProvider>{children}</SessionProvider></QueryClientProvider>;
}
