import { ENV } from '@shared/config/env';

import type { AnalyticsEvent } from './analytics.events';
import type { AnalyticsProvider, EventProperties } from './analytics.types';
import { ConsoleAnalyticsProvider } from './console.provider';
import { MixpanelProvider } from './mixpanel.provider';

/**
 * The app's analytics service.
 *
 * One `track()` fans out to every configured provider. Zero providers is a
 * valid configuration — the service becomes a no-op rather than an error, which
 * is what keeps tests and a fresh clone quiet with no special-casing.
 *
 * Two rules this file exists to enforce:
 *
 *   1. Nothing here may throw into product code. A blocked script, a vendor
 *      outage, a provider that was never configured: all of it is swallowed.
 *      A click handler must never fail because analytics did.
 *   2. The kill switch is checked on every call, and an UNKNOWN answer means
 *      off. See `enable()` below.
 */

function buildProviders(): AnalyticsProvider[] {
  const out: AnalyticsProvider[] = [];

  for (const name of ENV.ANALYTICS_PROVIDERS) {
    if (name === 'mixpanel') {
      if (ENV.MIXPANEL_TOKEN === '') continue;
      out.push(new MixpanelProvider(ENV.MIXPANEL_TOKEN));
    } else if (name === 'console') {
      out.push(new ConsoleAnalyticsProvider());
    }
  }

  return out;
}

class AnalyticsService {
  private readonly providers = buildProviders();
  private initialised = false;

  /**
   * Tri-state on purpose.
   *
   * `null` is "the server has not told us yet", and it is NOT the same as
   * `false`. Every other feature flag in this app fails open — a flaky network
   * must not strip features out of the product — but analytics inverts that:
   * "assume on" after a failed read would silently resume tracking somebody an
   * operator switched off, and if that switch was thrown for a privacy reason,
   * that is the one behaviour that must not happen.
   *
   * The cost of this default is a few lost events at startup. The cost of the
   * other one is tracking a person you promised not to.
   */
  private allowed: boolean | null = null;
  /** Replayed onto providers when they start — see `register`. */
  private superProperties: EventProperties = {};

  private get live(): boolean {
    return this.allowed === true && this.providers.length > 0;
  }

  /**
   * Called once the server's answer is known.
   *
   * Providers are initialised lazily HERE rather than at module load, so a
   * disabled app never loads a vendor SDK at all — not loaded-then-muted.
   */
  enable(allowed: boolean): void {
    this.allowed = allowed;
    if (!allowed || this.initialised || this.providers.length === 0) return;

    for (const provider of this.providers) {
      try {
        provider.init();
        if (Object.keys(this.superProperties).length > 0) {
          provider.register(this.superProperties);
        }
      } catch {
        // A provider that cannot start is simply not used.
      }
    }

    this.initialised = true;
  }

  private forEach(run: (provider: AnalyticsProvider) => void): void {
    if (!this.live || !this.initialised) return;

    for (const provider of this.providers) {
      try {
        run(provider);
      } catch {
        // Swallowed by design — see the rules at the top of this file.
      }
    }
  }

  track(event: AnalyticsEvent, properties: EventProperties = {}): void {
    this.forEach((provider) => {
      provider.track(event, { ...properties, app_env: ENV.APP_ENV });
    });
  }

  identify(userId: string): void {
    this.forEach((provider) => { provider.identify(userId); });
  }

  /**
   * Attach properties to every later event.
   *
   * Held locally as well, so a `register` that happens before the kill switch
   * is answered is replayed once providers start rather than being lost.
   */
  register(properties: EventProperties): void {
    this.superProperties = { ...this.superProperties, ...properties };
    this.forEach((provider) => { provider.register(properties); });
  }

  setProfile(properties: EventProperties): void {
    this.forEach((provider) => { provider.setProfile(properties); });
  }

  incrementProfile(property: string, by = 1): void {
    this.forEach((provider) => { provider.incrementProfile(property, by); });
  }

  /**
   * Forget the current person. Called on sign-out.
   *
   * Skipping this is how a shared laptop attributes one person's cooking to
   * whoever signs in next.
   */
  reset(): void {
    this.forEach((provider) => { provider.reset(); });
  }
}

export const analytics = new AnalyticsService();
