import { CREDENTIALS_STORAGE_KEY } from './storageKey'

export function clearCredentials() {
  localStorage.removeItem(CREDENTIALS_STORAGE_KEY)
}
