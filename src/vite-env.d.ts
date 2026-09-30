/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_ENV: string;
  /** Comma-separated: `mixpanel,console`. Empty or absent means analytics is off. */
  readonly VITE_ANALYTICS_PROVIDERS?: string;
  /** Required only when `mixpanel` is in the provider list. */
  readonly VITE_MIXPANEL_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
