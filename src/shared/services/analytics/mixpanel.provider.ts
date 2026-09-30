import mixpanel from 'mixpanel-browser';

import { IS_DEVELOPMENT } from '@shared/config/env';

import type { AnalyticsProvider, EventProperties } from './analytics.types';

/**
 * Mixpanel, and the only file in the web app that imports its SDK.
 *
 * The vendor's reserved property names are translated HERE and nowhere else: a
 * call site says `email` and this decides that Mixpanel spells it `$email`.
 * That is what keeps the rest of the codebase free of one vendor's spelling —
 * and what makes a second provider a new file rather than an edit everywhere.
 */

const RESERVED: Record<string, string> = {
  email: '$email',
  name: '$name',
  created_at: '$created',
  first_name: '$first_name',
  last_name: '$last_name',
  phone: '$phone',
};

function toMixpanelProfile(properties: EventProperties): EventProperties {
  const out: EventProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    out[RESERVED[key] ?? key] = value;
  }
  return out;
}

export class MixpanelProvider implements AnalyticsProvider {
  readonly name = 'mixpanel';
  private started = false;

  constructor(private readonly token: string) {}

  init(): void {
    // Guarded because React 19 StrictMode mounts effects twice in development,
    // and `init` on an already-initialised instance warns.
    if (this.started) return;

    mixpanel.init(this.token, {
      // Page views are sent by the router subscription, which knows about
      // client-side navigation. The SDK's own autocapture would only ever see
      // the first load of a single-page app.
      autocapture: false,
      track_pageview: false,
      persistence: 'localStorage',
      debug: IS_DEVELOPMENT,
    });

    this.started = true;
  }

  track(event: string, properties: EventProperties): void {
    if (!this.started) return;
    mixpanel.track(event, properties);
  }

  register(properties: EventProperties): void {
    if (!this.started) return;
    mixpanel.register(properties);
  }

  identify(userId: string): void {
    if (!this.started) return;
    mixpanel.identify(userId);
  }

  setProfile(properties: EventProperties): void {
    if (!this.started) return;
    mixpanel.people.set(toMixpanelProfile(properties));
  }

  incrementProfile(property: string, by: number): void {
    if (!this.started) return;
    mixpanel.people.increment(property, by);
  }

  reset(): void {
    if (!this.started) return;
    mixpanel.reset();
  }
}
