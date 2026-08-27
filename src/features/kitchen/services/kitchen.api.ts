import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type { KitchenState, SaveKitchenPayload } from '../types/kitchen.types';

export const kitchenApi = {
  get: (): Promise<KitchenState> => apiClient.get<KitchenState>(EP.KITCHEN.GET),

  save: (payload: SaveKitchenPayload): Promise<KitchenState> =>
    apiClient.put<KitchenState>(EP.KITCHEN.SAVE, payload),
};
