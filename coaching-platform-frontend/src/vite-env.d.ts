/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BUNNY_STREAM_LIBRARY_ID: string;
  readonly VITE_BUNNY_STREAM_API_KEY: string;
  /** Optional: full App Store URL for the footer badge. Defaults to the main site if unset. */
  readonly VITE_APP_STORE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}