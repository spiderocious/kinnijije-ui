import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import { stockApi } from '../services/stock.api';
import type { StockDashboard, StockItem } from '../types/stock.types';

export const STOCK_KEY = ['stock'] as const;
export const DASHBOARD_KEY = ['stock', 'dashboard'] as const;

export function useStock() {
  return useQuery({ queryKey: STOCK_KEY, queryFn: stockApi.list });
}

export function useStockDashboard() {
  return useQuery<StockDashboard, ApiError>({
    queryKey: DASHBOARD_KEY,
    queryFn: stockApi.dashboard,
    // Stock changes as a side-effect of cooking and shopping, so a cached
    // dashboard goes stale without this screen doing anything.
    staleTime: 30 * 1000,
  });
}

/** Every write invalidates BOTH: the dashboard is derived from the list. */
function useStockInvalidation() {
  const queryClient = useQueryClient();
  return async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: STOCK_KEY }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
    ]);
  };
}

export function useAddStock() {
  const invalidate = useStockInvalidation();

  return useMutation<
    StockItem[],
    ApiError,
    { items: { catalogue_id?: string; name: string; quantity: number; unit: string }[]; source?: string }
  >({
    mutationFn: ({ items, source }) => stockApi.add(items, source),
    onSuccess: invalidate,
  });
}

export function useUpdateStock() {
  const invalidate = useStockInvalidation();

  return useMutation<StockItem, ApiError, { stockId: string; changes: { quantity?: number; unit?: string; storage?: string } }>({
    mutationFn: ({ stockId, changes }) => stockApi.update(stockId, changes),
    onSuccess: invalidate,
  });
}

export function useRemoveStock() {
  const invalidate = useStockInvalidation();

  return useMutation<void, ApiError, string>({
    mutationFn: stockApi.remove,
    onSuccess: invalidate,
  });
}

export function useStockUnits() {
  return useQuery({ queryKey: ['stock', 'units'], queryFn: stockApi.units });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, { label: string; abbr: string }>({
    mutationFn: ({ label, abbr }) => stockApi.createUnit(label, abbr),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stock', 'units'] });
    },
  });
}
