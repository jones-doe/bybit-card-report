// QueryClient and its persistence — shared by every query.

export { queryClient } from './queryClient'
export { persister } from './persister'
export { PERSISTED_CACHE_MAX_AGE_MS } from './persistedCacheMaxAge'
export { QUERY_STALE_TIME_MS } from './queryStaleTimeMs'
export { shouldDehydrateQuery } from './shouldDehydrateQuery'
