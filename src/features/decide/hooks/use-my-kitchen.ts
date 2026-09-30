import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useSession } from '@features/auth/hooks/use-session';
import { STOCK_KEY } from '@features/stock/hooks/use-stock';
import { stockApi } from '@features/stock/services/stock.api';

/**
 * A signed-in cook's kitchen, for pre-filling the flow.
 *
 * Their STOCK, not their onboarding answers: onboarding is a snapshot from the
 * day they joined, stock is what they have now, and it is what every other
 * screen already trusts.
 *
 * The query only runs for somebody signed in — `useStock` hits an
 * authenticated endpoint, and firing it for a guest would be a guaranteed 401
 * on the busiest page in the product.
 */
export interface MyKitchen {
  /** True once we know whether there is a kitchen to use. */
  ready: boolean;
  /** Empty for a guest, or for somebody whose stock is empty. */
  items: string[];
  /**
   * Whether the kitchen step can be skipped.
   *
   * False for a guest AND for a signed-in cook with nothing recorded: they see
   * the ordinary step, because there is nothing to confirm.
   */
  canSkip: boolean;
}

export function useMyKitchen(): MyKitchen {
  const { isSignedIn, isLoading: sessionLoading } = useSession();

  /**
   * Queried here rather than through `useStock`, which fires unconditionally.
   *
   * `/stock` is authenticated, so calling it for a guest is a guaranteed 401 on
   * the busiest page in the product. The SAME query key is used, so a signed-in
   * cook shares one cache entry with every other screen rather than fetching
   * their stock twice.
   */
  const stock = useQuery({
    queryKey: STOCK_KEY,
    queryFn: stockApi.list,
    enabled: !sessionLoading && isSignedIn,
  });

  return useMemo(() => {
    if (sessionLoading) return { ready: false, items: [], canSkip: false };
    if (!isSignedIn) return { ready: true, items: [], canSkip: false };
    if (stock.isPending) return { ready: false, items: [], canSkip: false };

    // Zero quantity is NOT "have it" — the same rule the matcher applies.
    const items = (stock.data ?? [])
      .filter((item) => item.quantity > 0)
      .map((item) => item.name);

    return { ready: true, items, canSkip: items.length > 0 };
  }, [sessionLoading, isSignedIn, stock.isPending, stock.data]);
}
