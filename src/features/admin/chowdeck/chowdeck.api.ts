import { EP } from '@shared/constants/endpoints';

import { qs, type Paged } from '../services/admin.api';
import { staffClient } from '../services/staff-client';

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

/**
 * The Chowdeck console endpoints.
 *
 * Through `staffClient`, like everything under /admin — NEVER `apiClient`.
 * `apiClient` attaches the CUSTOMER token, which `authenticateStaff` refuses
 * outright (`staff_token_invalid`): the two tokens are issued for different
 * audiences on purpose. This file was written before the console moved to its
 * own sign-in and was the one place still sending the customer token, which
 * is why every Chowdeck screen 401'd while the rest of the console worked.
 */
export const chowdeckApi = {
  overview: (): Promise<ChowdeckOverview> => staffClient.get<ChowdeckOverview>(EP.ADMIN.CHOWDECK_OVERVIEW),
  resetBreaker: (): Promise<void> => staffClient.post<void>(EP.ADMIN.CHOWDECK_BREAKER_RESET),

  // The request log. Bodies only ever come back on the detail.
  calls: (params: Params): Promise<Paged<CallRow>> =>
    staffClient.get<Paged<CallRow>>(`${EP.ADMIN.CHOWDECK_CALLS}${qs(params)}`),
  call: (id: string): Promise<CallDetail> => staffClient.get<CallDetail>(EP.ADMIN.CHOWDECK_CALL(id)),
  /** Sends the same request again, now. Spends one real call. */
  replay: (id: string): Promise<ReplayResult> =>
    staffClient.post<ReplayResult>(EP.ADMIN.CHOWDECK_CALL_REPLAY(id)),

  cache: (params: Params): Promise<Paged<CacheRow>> =>
    staffClient.get<Paged<CacheRow>>(`${EP.ADMIN.CHOWDECK_CACHE}${qs(params)}`),
  cacheEntry: (id: string): Promise<CacheDetail> =>
    staffClient.get<CacheDetail>(EP.ADMIN.CHOWDECK_CACHE_ENTRY(id)),
  refreshCache: (id: string): Promise<RefreshResult> =>
    staffClient.post<RefreshResult>(EP.ADMIN.CHOWDECK_CACHE_REFRESH(id)),
  clearCache: (scope: ClearScope, id?: string): Promise<{ cleared: number }> =>
    staffClient.post(EP.ADMIN.CHOWDECK_CACHE_CLEAR, { scope, ...(id !== undefined && { id }) }),

  coverage: (): Promise<Coverage> => staffClient.get<Coverage>(EP.ADMIN.CHOWDECK_COVERAGE),
  /** Returns a job id; the console follows it rather than waiting. */
  fetchAhead: (input: FetchAheadInput): Promise<FetchAheadResult> =>
    staffClient.post<FetchAheadResult>(EP.ADMIN.CHOWDECK_FETCH_AHEAD, input),

  places: (): Promise<PlaceList> => staffClient.get<PlaceList>(EP.ADMIN.CHOWDECK_PLACES),
  /** A live lookup against Chowdeck. Nothing is saved. */
  autocomplete: (input: string): Promise<AutocompleteResult> =>
    staffClient.post<AutocompleteResult>(EP.ADMIN.CHOWDECK_PLACES_AUTOCOMPLETE, { input }),
  savePlace: (input: SavePlaceInput): Promise<{ id: string }> =>
    staffClient.post(EP.ADMIN.CHOWDECK_PLACES, input),
  updatePlace: (placeId: string, input: UpdatePlaceInput): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.CHOWDECK_PLACE(placeId), input),
  deletePlace: (placeId: string): Promise<{ cleared: number }> =>
    staffClient.delete(EP.ADMIN.CHOWDECK_PLACE(placeId)),
  /** The default seed list. Returns a job id. */
  importPlaces: (): Promise<{ job_id: string; count: number }> =>
    staffClient.post(EP.ADMIN.CHOWDECK_PLACES_IMPORT, {}),
  /** The chosen places, and their cached searches. */
  deletePlaces: (ids: string[]): Promise<{ places: number; cleared: number }> =>
    staffClient.post(EP.ADMIN.CHOWDECK_PLACES_DELETE, { ids }),
  /** Every place and every cached search. */
  purgePlaces: (): Promise<{ places: number; cleared: number }> =>
    staffClient.post(EP.ADMIN.CHOWDECK_PLACES_PURGE, {}),

  clicks: (params: Params): Promise<Paged<ClickRow>> =>
    staffClient.get<Paged<ClickRow>>(`${EP.ADMIN.CHOWDECK_CLICKS}${qs(params)}`),
};
