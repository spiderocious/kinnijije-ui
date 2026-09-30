import type { AnalyticsProvider, EventProperties } from './analytics.types';

/**
 * Writes events to the browser console instead of sending them anywhere.
 *
 * What you develop against: the event stream is visible with no vendor account,
 * no token and no network call, so a wrong property name shows up while you are
 * writing it rather than a week later in somebody's dashboard.
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'console';

  init(): void {
    // Nothing to set up.
  }

  track(event: string, properties: EventProperties): void {
    // eslint-disable-next-line no-console -- this provider's entire purpose
    console.log(`%c◆ ${event}`, 'color:#1798d6;font-weight:bold', properties);
  }

  register(properties: EventProperties): void {
    // eslint-disable-next-line no-console -- this provider's entire purpose
    console.log('%c◆ register', 'color:#6e8798;font-weight:bold', properties);
  }

  identify(userId: string): void {
    // eslint-disable-next-line no-console -- this provider's entire purpose
    console.log('%c◆ identify', 'color:#8b7cf6;font-weight:bold', userId);
  }

  setProfile(properties: EventProperties): void {
    // eslint-disable-next-line no-console -- this provider's entire purpose
    console.log('%c◆ profile', 'color:#8b7cf6;font-weight:bold', properties);
  }

  incrementProfile(property: string, by: number): void {
    // eslint-disable-next-line no-console -- this provider's entire purpose
    console.log('%c◆ increment', 'color:#8b7cf6;font-weight:bold', property, by);
  }

  reset(): void {
    // eslint-disable-next-line no-console -- this provider's entire purpose
    console.log('%c◆ reset', 'color:#6e8798;font-weight:bold');
  }
}
