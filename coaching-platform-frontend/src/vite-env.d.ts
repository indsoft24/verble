/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BUNNY_STREAM_LIBRARY_ID: string;
  readonly VITE_BUNNY_STREAM_API_KEY: string;
  // Add any other environment variables you have here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}