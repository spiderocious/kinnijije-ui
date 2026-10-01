import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { chowdeckApi } from '@features/chowdeck/chowdeck.api';
import type { DecidePlace } from '@features/decide/types/decide.types';

/**
 * A place to look for offers in, without asking for one.
 *
 * The tap flow has a whole area-picker step; the chat flow deliberately does
 * not — five questions is worse than four, and "which part of Lagos" is not a
 * thing somebody wants to answer before dinner.
 *
 * So the place is INFERRED. That is why offers stopped appearing in Ask: the
 * verdict deck only shows them when `place !== null`, and Ask was always
 * passing null because nothing ever set one.
 *
 * Matched on the city they already gave, falling back to the first saved
 * place. A wrong-but-nearby area is a far better failure than no offers at
 * all — the cards say where they are, so nothing is being claimed falsely.
 */
export function useAskPlace(enabled: boolean, city: string | null): DecidePlace | null {
  const { data } = useQuery({
    // Shares the cache entry `usePlacesAvailable` uses, so this costs no
    // extra request on a screen that already asked.
    queryKey: ['chowdeck', 'places', ''],
    queryFn: () => chowdeckApi.searchPlaces(''),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const places = data ?? [];
    if (places.length === 0) return null;

    if (city !== null) {
      const wanted = city.trim().toLowerCase();
      const match = places.find((place) => place.city?.toLowerCase() === wanted);
      if (match !== undefined) return match;
    }

    // Better than nothing: the card names the area, so a cook can see it is
    // not theirs and ignore it.
    return places[0] ?? null;
  }, [data, city]);
}
