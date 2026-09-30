import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type {
  DecideHistoryEntry,
  DecideOptions,
  DecidePayload,
  DecideStats,
  DecideVerdict,
} from '../types/decide.types';

/**
 * The public endpoints, plus history.
 *
 * Neither sends a token, and neither needs one — this is the whole point of
 * the flow. `apiClient` attaches a token when one exists, which is harmless
 * here: the backend routes do not authenticate.
 */
export const decideApi = {
  options: (): Promise<DecideOptions> => apiClient.get<DecideOptions>(EP.DECIDE.OPTIONS),

  stats: (): Promise<DecideStats> => apiClient.get<DecideStats>(EP.DECIDE.STATS),

  decide: (payload: DecidePayload): Promise<DecideVerdict> =>
    apiClient.post<DecideVerdict>(EP.DECIDE.DECIDE, payload),

  /**
   * A signed-in cook's own past decisions. 401s for a guest, which is why
   * every caller gates the query on the session rather than catching it.
   */
  history: (): Promise<DecideHistoryEntry[]> =>
    apiClient.get<DecideHistoryEntry[]>(EP.DECIDE.HISTORY),

  historyEntry: (id: string): Promise<DecideHistoryEntry> =>
    apiClient.get<DecideHistoryEntry>(EP.DECIDE.HISTORY_ENTRY(id)),

  removeHistoryEntry: (id: string): Promise<void> =>
    apiClient.delete<void>(EP.DECIDE.HISTORY_ENTRY(id)),
};
