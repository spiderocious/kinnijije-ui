import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DASHBOARD_KEY, STOCK_KEY } from '@features/stock/hooks/use-stock';
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
    onSuccess: invalidate,
  });
}

export function useSetBought() {
  const invalidate = useMarketInvalidation();
  return useMutation<MarketItem, ApiError, { marketId: string; bought: boolean }>({
    mutationFn: ({ marketId, bought }) => marketApi.setBought(marketId, bought),
    onSuccess: invalidate,
  });
}

export function useRemoveMarketItem() {
  const invalidate = useMarketInvalidation();
  return useMutation<void, ApiError, string>({ mutationFn: marketApi.remove, onSuccess: invalidate });
}

export function useClearBought() {
  const invalidate = useMarketInvalidation();
  return useMutation<{ removed: number }, ApiError, void>({
    mutationFn: marketApi.clearBought,
    onSuccess: invalidate,
  });
}
