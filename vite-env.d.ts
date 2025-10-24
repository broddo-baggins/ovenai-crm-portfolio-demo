/// <reference types="vite/client" />

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
    __i18n_logged_keys__?: Set<string>;
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Service role key intentionally excluded from client-side types for security
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 