/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin (or dev-proxy prefix) the Bybit API is called on. */
  readonly VITE_BYBIT_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
