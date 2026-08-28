import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { stockApi } from '../services/stock.api';

/** Long enough to stop a request per keystroke, short enough to feel instant. */
const DEBOUNCE_MS = 180;

/**
 * Google-style typeahead over the catalogue.
 *
 * Debounced because the alternative is a request for every character — and
 * `keepPreviousData` so the list does not blank out between keystrokes, which
 * reads as flickering rather than searching.
 */
export function useIngredientSearch(query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return useQuery({
    queryKey: ['ingredients', debounced],
    queryFn: () => stockApi.suggest(debounced),
    enabled: debounced.trim().length > 0,
    // The catalogue does not change; once fetched a query never needs refetching.
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}
