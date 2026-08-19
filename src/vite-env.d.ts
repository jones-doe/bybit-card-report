/// <reference types="vite/client" />

type ImportMetaEnv = {
  /** Origin (or dev-proxy prefix) the Bybit API is called on. */
  readonly VITE_BYBIT_BASE?: string
}

type ImportMeta = {
  readonly env: ImportMetaEnv
}
