import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

/**
 * Query cache lives in localStorage, so a reload starts from what we already had.
 *
 * The async persister is the supported one — `createSyncStoragePersister` is
 * deprecated. localStorage satisfies the AsyncStorage shape as-is: the persister
 * awaits whatever the methods return, values included.
 */
export const persister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: 'bybit-card-report:query-cache',
  throttleTime: 1_000,
})
