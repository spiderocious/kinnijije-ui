function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Comma-separated provider names. EMPTY IS VALID and is the default: analytics
 * becomes a no-op and the app behaves identically, which is what keeps tests
 * and a fresh clone quiet with no special-casing.
 */
function providerList(raw: string | undefined): readonly string[] {
  return (raw ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 0);
}

export const ENV = {
  API_BASE_URL: requireEnv('VITE_API_BASE_URL'),
  APP_ENV: import.meta.env.VITE_APP_ENV ?? 'development',
  ANALYTICS_PROVIDERS: providerList(import.meta.env.VITE_ANALYTICS_PROVIDERS),
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN ?? '',
} as const;

export const IS_DEVELOPMENT = ENV.APP_ENV === 'development';
