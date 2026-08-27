import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';

import { SessionProvider } from '@features/auth/hooks/use-session';
import { queryClient } from '@shared/services/query-client';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Global providers. Feature-scoped state belongs in the feature's own provider,
 * not here — shared state across features is what causes cross-feature bugs.
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Inside the query client: the session is server state and reads through it. */}
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
