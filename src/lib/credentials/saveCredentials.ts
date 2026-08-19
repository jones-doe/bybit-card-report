import type { Credentials } from '@/requests/shared'
import { CREDENTIALS_STORAGE_KEY } from './storageKey'

export function saveCredentials(credentials: Credentials) {
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))
}
