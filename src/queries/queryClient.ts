import { QueryClient } from '@tanstack/react-query'
import { isRateLimited } from '@/requests'

/** Rate-limit retries. Anything else fails immediately — a bad key will not heal. */
const MAX_RATE_LIMIT_RETRIES = 7
const BASE_BACKOFF_MS = 1_500
const MAX_BACKOFF_MS = 60_000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The history is a heavy, rate-limited walk: never re-run it just because
      // a window regained focus. Refreshing is an explicit action.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: Infinity,
      // Never garbage-collect in memory; the persisted copy is what expires,
      // and it does so by maxAge. A finite gcTime is also a trap here: anything
      // above ~24.8 days overflows setTimeout and fires immediately, which
      // silently drops the just-restored cache.
      gcTime: Infinity,

      // failureCount is 0 on the first retry decision and passed before the
      // increment, same as react-query's own defaults — so `<` gives exactly
      // MAX_RATE_LIMIT_RETRIES retries and `2 ** failureCount` starts at 1x.
      retry: (failureCount, error) =>
        isRateLimited(error) && failureCount < MAX_RATE_LIMIT_RETRIES,

      retryDelay: (failureCount, error) => {
        const backoff = Math.min(BASE_BACKOFF_MS * 2 ** failureCount, MAX_BACKOFF_MS)
        // Cross-origin this header is invisible, so resetAt is usually null and
        // the plain exponential backoff carries the retry on its own.
        const resetAt = isRateLimited(error) ? error.resetAt : null
        const untilReset = resetAt ? resetAt - Date.now() + 500 : 0
        return Math.max(backoff, untilReset)
      },
    },
  },
})
