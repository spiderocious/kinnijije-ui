/**
 * The analytics boundary.
 *
 * No component, hook or service outside this folder imports a vendor SDK. Call
 * sites talk to `analytics`, which forwards to whichever providers are enabled
 * — or to none, which is a valid configuration rather than an error.
 */

/** No nested objects: providers flatten them inconsistently, so the shape is kept flat. */
export type PropertyValue = string | number | boolean | null | undefined | string[] | number[];

export type EventProperties = Record<string, PropertyValue>;

export interface AnalyticsProvider {
  readonly name: string;
  init(): void;
  track(event: string, properties: EventProperties): void;
  identify(userId: string): void;
  /** Properties attached to every subsequent event from this provider. */
  register(properties: EventProperties): void;
  setProfile(properties: EventProperties): void;
  incrementProfile(property: string, by: number): void;
  /** Forget the current person. Called on sign-out. */
  reset(): void;
}
