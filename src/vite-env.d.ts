/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_DATA?: string;
  readonly VITE_WP_API_BASE?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_WP_SYNC_USERNAME?: string;
  readonly VITE_WP_SYNC_APP_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
