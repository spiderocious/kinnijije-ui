import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import { qs, type Paged } from '../services/admin.api';

import type {
  AutocompleteResult,
  CacheDetail,
  CacheRow,
  CallDetail,
  CallRow,
  ChowdeckOverview,
  ClearScope,
  ClickRow,
  Coverage,
  FetchAheadInput,
  FetchAheadResult,
  PlaceList,
  RefreshResult,
  ReplayResult,
  SavePlaceInput,
  UpdatePlaceInput,
} from './chowdeck.types';

type Params = Record<string, string | number | undefined>;

export const chowdeckApi = {
  overview: (): Promise<ChowdeckOverview> => apiClient.get<ChowdeckOverview>(EP.ADMIN.CHOWDECK_OVERVIEW),
  resetBreaker: (): Promise<void> => apiClient.post<void>(EP.ADMIN.CHOWDECK_BREAKER_RESET),

  // The request log. Bodies only ever come back on the detail.
  calls: (params: Params): Promise<Paged<CallRow>> =>
    apiClient.get<Paged<CallRow>>(`${EP.ADMIN.CHOWDECK_CALLS}${qs(params)}`),
  call: (id: string): Promise<CallDetail> => apiClient.get<CallDetail>(EP.ADMIN.CHOWDECK_CALL(id)),
  /** Sends the same request again, now. Spends one real call. */
  replay: (id: string): Promise<ReplayResult> =>
    apiClient.post<ReplayResult>(EP.ADMIN.CHOWDECK_CALL_REPLAY(id)),

  cache: (params: Params): Promise<Paged<CacheRow>> =>
    apiClient.get<Paged<CacheRow>>(`${EP.ADMIN.CHOWDECK_CACHE}${qs(params)}`),
  cacheEntry: (id: string): Promise<CacheDetail> =>
    apiClient.get<CacheDetail>(EP.ADMIN.CHOWDECK_CACHE_ENTRY(id)),
  refreshCache: (id: string): Promise<RefreshResult> =>
    apiClient.post<RefreshResult>(EP.ADMIN.CHOWDECK_CACHE_REFRESH(id)),
  clearCache: (scope: ClearScope, id?: string): Promise<{ cleared: number }> =>
    apiClient.post(EP.ADMIN.CHOWDECK_CACHE_CLEAR, { scope, ...(id !== undefined && { id }) }),

  coverage: (): Promise<Coverage> => apiClient.get<Coverage>(EP.ADMIN.CHOWDECK_COVERAGE),
  /** Returns a job id; the console follows it rather than waiting. */
  fetchAhead: (input: FetchAheadInput): Promise<FetchAheadResult> =>
    apiClient.post<FetchAheadResult>(EP.ADMIN.CHOWDECK_FETCH_AHEAD, input),

  places: (): Promise<PlaceList> => apiClient.get<PlaceList>(EP.ADMIN.CHOWDECK_PLACES),
  /** A live lookup against Chowdeck. Nothing is saved. */
  autocomplete: (input: string): Promise<AutocompleteResult> =>
    apiClient.post<AutocompleteResult>(EP.ADMIN.CHOWDECK_PLACES_AUTOCOMPLETE, { input }),
  savePlace: (input: SavePlaceInput): Promise<{ id: string }> =>
    apiClient.post(EP.ADMIN.CHOWDECK_PLACES, input),
  updatePlace: (placeId: string, input: UpdatePlaceInput): Promise<void> =>
    apiClient.patch<void>(EP.ADMIN.CHOWDECK_PLACE(placeId), input),
  deletePlace: (placeId: string): Promise<{ cleared: number }> =>
    apiClient.delete(EP.ADMIN.CHOWDECK_PLACE(placeId)),
  /** The default seed list. Returns a job id. */
  importPlaces: (): Promise<{ job_id: string; count: number }> =>
    apiClient.post(EP.ADMIN.CHOWDECK_PLACES_IMPORT, {}),
  /** The chosen places, and their cached searches. */
  deletePlaces: (ids: string[]): Promise<{ places: number; cleared: number }> =>
    apiClient.post(EP.ADMIN.CHOWDECK_PLACES_DELETE, { ids }),
  /** Every place and every cached search. */
  purgePlaces: (): Promise<{ places: number; cleared: number }> =>
    apiClient.post(EP.ADMIN.CHOWDECK_PLACES_PURGE, {}),

  clicks: (params: Params): Promise<Paged<ClickRow>> =>
    apiClient.get<Paged<ClickRow>>(`${EP.ADMIN.CHOWDECK_CLICKS}${qs(params)}`),
};
