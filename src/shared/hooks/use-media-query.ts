import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query from React.
 *
 * The scenes take a `frame` prop because a viewer renders a phone and a desktop
 * side by side. A real screen has no such prop — it has one viewport that can
 * change under it, so the layout switch has to be reactive.
 *
 * Used only where a component genuinely needs a DIFFERENT composition (the hero
 * is centred on a phone and split on a desktop). Anything that can be done in
 * Tailwind should be done in Tailwind — this costs a listener and a render.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // Guarded for SSR and for the initial render before an effect runs.
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Re-read on mount: the query may have changed between first render and
    // the effect firing.
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => {
      list.removeEventListener('change', onChange);
    };
  }, [query]);

  return matches;
}

/** Tailwind's `lg` breakpoint, so JS and CSS switch at the same width. */
export const DESKTOP_QUERY = '(min-width: 1024px)';
