import { useEffect, useRef } from 'react';

import { EVENTS, analytics } from '@shared/services/analytics';
import type { EventProperties } from '@shared/services/analytics';

type ViewEvent = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Sends a view event once, when the data behind it is ready.
 *
 * Two things this exists to get right, and both are easy to get wrong inline:
 *
 *   1. React 19 StrictMode mounts effects TWICE in development, which would
 *      double every view event and quietly halve every rate computed from one.
 *   2. Screens paint before their query resolves, so an effect on mount alone
 *      reports zeros. `ready` holds the event until the numbers are real.
 *
 * `key` re-arms it: a detail screen navigated from one id to another is a new
 * view, but the component never unmounted.
 */
export function useTrackedView(
  event: ViewEvent,
  ready: boolean,
  properties: () => EventProperties,
  key: string | null = null,
): void {
  const sentFor = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    const token = key ?? '__once__';
    if (sentFor.current === token) return;
    sentFor.current = token;

    analytics.track(event, properties());
    // `properties` is a fresh closure each render and is deliberately not a
    // dependency — it is read only at the moment the event fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ready, key]);
}
