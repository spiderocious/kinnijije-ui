import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DASHBOARD_KEY, STOCK_KEY } from '@features/stock/hooks/use-stock';
import { EVENTS, analytics } from '@shared/services/analytics';
import type { ApiError } from '@shared/services/api-client';

import { marketApi, type MarketItem, type MarketList } from '../services/market.api';

const MARKET_KEY = ['market'] as const;

export function useMarket() {
  return useQuery<MarketList, ApiError>({ queryKey: MARKET_KEY, queryFn: marketApi.list });
}

/**
 * Ticking something bought moves it into stock, so BOTH have to be
 * invalidated — otherwise the kitchen shows yesterday's contents.
 */
function useMarketInvalidation() {
  const queryClient = useQueryClient();
  return async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: MARKET_KEY }),
      queryClient.invalidateQueries({ queryKey: STOCK_KEY }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
    ]);
  };
}

export function useAddMarketItem() {
  const invalidate = useMarketInvalidation();
  return useMutation<MarketItem, ApiError, { name: string; catalogue_id?: string; quantity?: number; unit?: string }>({
    mutationFn: marketApi.add,
    onSuccess: async (item, variables) => {
      // `from_meal` is the missing-ingredient loop working. If it is rarely
      // used, that handoff from a recipe to the list is broken.
      analytics.track(EVENTS.MARKET_ITEM_ADDED, {
        // `reason` is set when the item came from a recipe's missing list.
        source: item.reason !== null ? 'from_meal' : 'manual',
        has_quantity: variables.quantity !== undefined,
        market_id: item.id,
      });
      await invalidate();
    },
  });
}

export function useSetBought() {
  const invalidate = useMarketInvalidation();
  return useMutation<MarketItem, ApiError, { marketId: string; bought: boolean }>({
    mutationFn: ({ marketId, bought }) => marketApi.setBought(marketId, bought),
    onSuccess: async (item, variables) => {
      // `hours_on_list` is in the plan but NOT sent: `MarketItem` carries no
      // timestamp, so there is nothing here to measure it from. Deriving it
      // from when the client happened to fetch the list would be a number that
      // looks real and is not. It needs a `created_at` on the API first.
      analytics.track(EVENTS.MARKET_ITEM_BOUGHT, {
        market_id: variables.marketId,
        bought: variables.bought,
        was_from_meal: item.reason !== null,
      });
      await invalidate();
    },
  });
}

export function useRemoveMarketItem() {
  const invalidate = useMarketInvalidation();
  return useMutation<void, ApiError, string>({
    mutationFn: marketApi.remove,
    onSuccess: async (_result, marketId) => {
      // Removing something unbought is a changed mind: the list suggested
      // something they did not want.
      analytics.track(EVENTS.MARKET_ITEM_REMOVED, { market_id: marketId });
      await invalidate();
    },
  });
}

export function useClearBought() {
  const invalidate = useMarketInvalidation();
  return useMutation<{ removed: number }, ApiError, void>({
    mutationFn: marketApi.clearBought,
    onSuccess: async (result) => {
      // A completed shop. Pair with `stock_added` just after to see whether
      // shopping actually feeds the kitchen back.
      analytics.track(EVENTS.MARKET_BOUGHT_CLEARED, { removed_count: result.removed });
      await invalidate();
    },
  });
}
