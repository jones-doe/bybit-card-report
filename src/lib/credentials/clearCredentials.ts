import { CREDENTIALS_STORAGE_KEY } from './storageKey'

export const clearCredentials = () => {
  localStorage.removeItem(CREDENTIALS_STORAGE_KEY)
}
