function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  API_BASE_URL: requireEnv('VITE_API_BASE_URL'),
  APP_ENV: import.meta.env.VITE_APP_ENV ?? 'development',
} as const;

export const IS_DEVELOPMENT = ENV.APP_ENV === 'development';
