import { useDeferredValue } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { ApiError } from '@shared/services/api-client';

import { chowdeckApi } from './chowdeck.api';

/**
 * Saved places, searched as somebody types.
 *
 * Deferred rather than debounced: the list is our own table behind a cache
 * header, so the cost of an extra keystroke's request is small, and a
 * deferred value keeps the input responsive without a timer. The previous
 * list stays up while the next one loads, so results never flash empty.
 */
export function usePlaceSearch(q: string, enabled = true) {
  const deferred = useDeferredValue(q.trim());

  return useQuery({
    queryKey: ['chowdeck', 'places', deferred.toLowerCase()],
    queryFn: () => chowdeckApi.searchPlaces(deferred),
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Whether there is anywhere to pick at all.
 *
 * Every place-dependent control — "I'll order", the area picker — hangs off
 * this. With no saved places they would lead to a list with nothing in it, so
 * they stay hidden and the old city field stands in. While the list is empty
 * it is re-asked every fifteen seconds: the first search queues the default
 * import on the server, and the controls should appear once it lands without
 * anybody reloading.
 *
 * Shares its cache entry with the picker's empty-query search, so this costs
 * no extra request.
 */
export function usePlacesAvailable(enabled: boolean): boolean {
  const { data } = useQuery({
    queryKey: ['chowdeck', 'places', ''],
    queryFn: () => chowdeckApi.searchPlaces(''),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: (query) => ((query.state.data?.length ?? 0) === 0 ? 15_000 : false),
  });

  return enabled && (data?.length ?? 0) > 0;
}

/**
 * Offers for one meal in one place.
 *
 * `enabled` is how the verdict avoids asking for all six meals at once: only
 * the card on screen asks. The server caches for hours, so the browser holds
 * an answer for ten minutes — long enough that swiping back and forth costs
 * nothing, short enough that "open now" is not badly out of date.
 *
 * Never retried on a 429: the refusal already says how long to wait, and a
 * retry would only spend the next token.
 */
export function useChowdeckOffers(
  input: { meal: string; place: string | null; mode: 'cook' | 'order' },
  enabled: boolean,
) {
  const place = input.place;

  return useQuery({
    queryKey: ['chowdeck', 'offers', input.meal, place, input.mode],
    queryFn: () => chowdeckApi.offers({ meal: input.meal, place: place ?? '', mode: input.mode }),
    enabled: enabled && place !== null && input.meal.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failures, error) =>
      !(error instanceof ApiError && (error.status === 429 || error.status === 404)) && failures < 1,
  });
}
