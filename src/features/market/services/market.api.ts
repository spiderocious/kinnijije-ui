import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface MarketItem {
  id: string;
  catalogue_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  reason: string | null;
  bought: boolean;
  icon: string;
  group: string;
  estimated_cost: number | null;
}

export interface MarketList {
  items: MarketItem[];
  total_items: number;
  bought_count: number;
  estimated_total: number;
  unblocks: { meal_name: string; needs: string[] }[];
}

export const marketApi = {
  list: (): Promise<MarketList> => apiClient.get<MarketList>(EP.MARKET.LIST),
  add: (payload: { name: string; catalogue_id?: string; quantity?: number; unit?: string; reason?: string }) =>
    apiClient.post<MarketItem>(EP.MARKET.ADD, payload),
  setBought: (marketId: string, bought: boolean): Promise<MarketItem> =>
    apiClient.patch<MarketItem>(EP.MARKET.BOUGHT(marketId), { bought }),
  remove: (marketId: string): Promise<void> => apiClient.delete<void>(EP.MARKET.DETAIL(marketId)),
  clearBought: (): Promise<{ removed: number }> =>
    apiClient.delete<{ removed: number }>(EP.MARKET.CLEAR_BOUGHT),
};
