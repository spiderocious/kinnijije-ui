import { useQuery } from '@tanstack/react-query';

import { decideApi } from '../services/decide.api';

/**
 * The counters.
 *
 * Cached for three hours to match the server's own snapshot window: asking
 * more often cannot produce a different answer, and this sits on the most
 * visited page in the product.
 *
 * A failure is not surfaced. The strip simply does not render, because a
 * landing page that cannot load its decoration should still let somebody
 * decide what to eat.
 */
export function useDecideStats() {
  return useQuery({
    queryKey: ['decide', 'stats'],
    queryFn: () => decideApi.stats(),
    staleTime: 3 * 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });
}
