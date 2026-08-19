import type { Credentials } from '@/requests'
import { CREDENTIALS_STORAGE_KEY } from './storageKey'

export function saveCredentials(credentials: Credentials) {
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials))
}
