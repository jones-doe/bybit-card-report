import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

/** Query cache lives in localStorage, so a reload starts from what we already had. */
export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'bybit-card-report:query-cache',
  throttleTime: 1_000,
})
