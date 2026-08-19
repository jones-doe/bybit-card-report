import type { Credentials } from '@/requests/shared'
import { CREDENTIALS_STORAGE_KEY } from './storageKey'

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Credentials>
    if (!parsed.apiKey || !parsed.apiSecret) return null
    return { apiKey: parsed.apiKey, apiSecret: parsed.apiSecret }
  } catch {
    return null
  }
}
