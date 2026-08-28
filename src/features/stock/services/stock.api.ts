import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type {
  CustomUnit,
  IngredientSuggestion,
  StockDashboard,
  StockItem,
} from '../types/stock.types';

export const stockApi = {
  list: (): Promise<StockItem[]> => apiClient.get<StockItem[]>(EP.STOCK.LIST),

  dashboard: (): Promise<StockDashboard> => apiClient.get<StockDashboard>(EP.STOCK.DASHBOARD),

  suggest: (query: string): Promise<IngredientSuggestion[]> =>
    apiClient.get<IngredientSuggestion[]>(`${EP.STOCK.SUGGEST}?q=${encodeURIComponent(query)}`),

  add: (items: { catalogue_id?: string; name: string; quantity: number; unit: string }[], source?: string) =>
    apiClient.post<StockItem[]>(EP.STOCK.ADD, { items, ...(source !== undefined && { source }) }),

  update: (stockId: string, changes: { quantity?: number; unit?: string; storage?: string }) =>
    apiClient.patch<StockItem>(EP.STOCK.DETAIL(stockId), changes),

  remove: (stockId: string): Promise<void> => apiClient.delete<void>(EP.STOCK.DETAIL(stockId)),

  history: (): Promise<unknown[]> => apiClient.get<unknown[]>(EP.STOCK.HISTORY),

  units: (): Promise<CustomUnit[]> => apiClient.get<CustomUnit[]>(EP.STOCK.UNITS),

  createUnit: (label: string, abbr: string): Promise<CustomUnit> =>
    apiClient.post<CustomUnit>(EP.STOCK.UNITS, { label, abbr }),

  deleteUnit: (unitId: string): Promise<void> => apiClient.delete<void>(EP.STOCK.UNIT(unitId)),
};
