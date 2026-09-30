import { useCallback, useEffect, useState } from 'react';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import { chowdeckApi } from './chowdeck.api';
import type {
  AutocompleteResult,
  ClearScope,
  FetchAheadInput,
  FetchAheadResult,
  RefreshResult,
  ReplayResult,
  SavePlaceInput,
  UpdatePlaceInput,
} from './chowdeck.types';

/**
 * Everything Chowdeck, under one key.
 *
 * Nearly every action here touches more than one view — a refresh rewrites a
 * cache row, adds a call to the log, moves a coverage cell and a counter on
 * the overview — so mutations drop the whole subtree rather than guessing
 * which corners changed. It is a handful of small GETs.
 */
const CHOWDECK_KEY = ['admin', 'chowdeck'] as const;

type Params = Record<string, string | number | undefined>;

// ── Overview ─────────────────────────────────────────────────────────
export function useChowdeckOverview() {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.overview>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'overview'],
    queryFn: chowdeckApi.overview,
    // The guards move by the minute; the overview is where they are watched.
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useResetBreaker() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError>({
    mutationFn: chowdeckApi.resetBreaker,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...CHOWDECK_KEY, 'overview'] });
    },
  });
}

// ── The request log ──────────────────────────────────────────────────
export function useChowdeckCalls(params: Params) {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.calls>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'calls', params],
    queryFn: () => chowdeckApi.calls(params),
    // Paging keeps the table on screen instead of flashing skeleton rows.
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useChowdeckCall(id: string) {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.call>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'call', id],
    queryFn: () => chowdeckApi.call(id),
    enabled: id.length > 0,
  });
}

export function useReplayCall() {
  const queryClient = useQueryClient();
  return useMutation<ReplayResult, ApiError, string>({
    mutationFn: chowdeckApi.replay,
    onSuccess: async () => {
      // A replayed search also rewrites its cache row.
      await queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY });
    },
  });
}

// ── Cache ────────────────────────────────────────────────────────────
export function useChowdeckCache(params: Params) {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.cache>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'cache', params],
    queryFn: () => chowdeckApi.cache(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useChowdeckCacheEntry(id: string) {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.cacheEntry>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'cache-entry', id],
    queryFn: () => chowdeckApi.cacheEntry(id),
    enabled: id.length > 0,
    // "As served now" is computed against the clock: open and closed move
    // while the page is open, so it is re-read rather than trusted.
    staleTime: 0,
  });
}

export function useRefreshCacheEntry() {
  const queryClient = useQueryClient();
  return useMutation<RefreshResult, ApiError, string>({
    mutationFn: chowdeckApi.refreshCache,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY });
    },
  });
}

export function useClearCache() {
  const queryClient = useQueryClient();
  return useMutation<{ cleared: number }, ApiError, { scope: ClearScope; id?: string }>({
    mutationFn: ({ scope, id }) => chowdeckApi.clearCache(scope, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY });
    },
  });
}

// ── Coverage ─────────────────────────────────────────────────────────
export function useChowdeckCoverage() {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.coverage>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'coverage'],
    queryFn: chowdeckApi.coverage,
  });
}

export function useFetchAhead() {
  const queryClient = useQueryClient();
  return useMutation<FetchAheadResult, ApiError, FetchAheadInput>({
    mutationFn: chowdeckApi.fetchAhead,
    onSuccess: async () => {
      // Nothing in the cache has changed YET — the job does the work. The
      // queue board is what moved.
      await queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
  });
}

// ── Places ───────────────────────────────────────────────────────────
export function useChowdeckPlaces() {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.places>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'places'],
    queryFn: chowdeckApi.places,
  });
}

/** Waits for the typing to stop. Every lookup is a real call to Chowdeck. */
export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(value);
    }, ms);
    return () => {
      clearTimeout(timer);
    };
  }, [value, ms]);
  return settled;
}

/**
 * The live place search.
 *
 * A query, not a mutation, so typing the same thing twice is answered from
 * memory instead of spending a second call against their daily cap.
 *
 * Keyed OUTSIDE `['admin']` on purpose: console mutations drop that whole
 * tree, and a refetch of this one is a live call to Chowdeck. The "saved" mark
 * after a save is handled by the row itself instead.
 */
export function usePlaceAutocomplete(input: string) {
  const trimmed = input.trim();
  return useQuery<AutocompleteResult, ApiError>({
    queryKey: ['chowdeck-console-autocomplete', trimmed.toLowerCase()],
    queryFn: () => chowdeckApi.autocomplete(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSavePlace() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, ApiError, SavePlaceInput>({
    mutationFn: chowdeckApi.savePlace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { placeId: string; input: UpdatePlaceInput }>({
    mutationFn: ({ placeId, input }) => chowdeckApi.updatePlace(placeId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();
  return useMutation<{ cleared: number }, ApiError, string>({
    mutationFn: chowdeckApi.deletePlace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY });
    },
  });
}

export function useImportPlaces() {
  const queryClient = useQueryClient();
  return useMutation<{ job_id: string; count: number }, ApiError>({
    mutationFn: chowdeckApi.importPlaces,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
  });
}

/** Deletes the selected places. Refreshes the same views a purge does. */
export function useDeletePlaces() {
  const queryClient = useQueryClient();
  return useMutation<{ places: number; cleared: number }, ApiError, string[]>({
    mutationFn: chowdeckApi.deletePlaces,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY }),
        queryClient.invalidateQueries({ queryKey: ['chowdeck', 'places'] }),
      ]);
    },
  });
}

/**
 * Deletes every place and the whole cache with them. Everything Chowdeck is
 * dropped afterwards — places, cache, coverage and the overview all change —
 * and so is the app's own place list, which is what cooks pick from.
 */
export function usePurgePlaces() {
  const queryClient = useQueryClient();
  return useMutation<{ places: number; cleared: number }, ApiError>({
    mutationFn: chowdeckApi.purgePlaces,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY }),
        queryClient.invalidateQueries({ queryKey: ['chowdeck', 'places'] }),
      ]);
    },
  });
}

// ── Clicks ───────────────────────────────────────────────────────────
export function useChowdeckClicks(params: Params) {
  return useQuery<Awaited<ReturnType<typeof chowdeckApi.clicks>>, ApiError>({
    queryKey: [...CHOWDECK_KEY, 'clicks', params],
    queryFn: () => chowdeckApi.clicks(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** Drops every Chowdeck view. For after a job the console was following lands. */
export function useInvalidateChowdeck() {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.invalidateQueries({ queryKey: CHOWDECK_KEY }), [queryClient]);
}
