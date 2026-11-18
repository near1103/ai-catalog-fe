'use client';

import { AuthProvider } from '@/features/auth/auth-provider';
import { QueryProvider } from '@/lib/query-provider';

export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
