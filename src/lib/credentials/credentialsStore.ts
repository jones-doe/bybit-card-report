import { persistentAtom } from '@nanostores/persistent'
import type { Credentials } from '@/requests/shared'
import { CREDENTIALS_STORAGE_KEY } from './storageKey'

/**
 * The API key pair, persisted to localStorage. `null` means signed out.
 *
 * nanostores/persistent syncs the store across tabs by default (a `storage`
 * event listener triggers a re-decode) — logging out in one tab now signs the
 * others out too, instead of them silently keeping a stale in-memory copy.
 */
export const credentialsStore = persistentAtom<Credentials | null>(CREDENTIALS_STORAGE_KEY, null, {
  encode: (value) => (value ? JSON.stringify(value) : undefined),
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw) as Partial<Credentials>
      return parsed.apiKey && parsed.apiSecret
        ? { apiKey: parsed.apiKey, apiSecret: parsed.apiSecret }
        : null
    } catch {
      return null
    }
  },
})
