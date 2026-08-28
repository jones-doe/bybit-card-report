import type { Query } from '@tanstack/react-query'

/**
 * React-query's own default only persists a query when its *last* attempt
 * succeeded (`status === 'success'`). That default combined with
 * `refetchOnMount` + a `staleTime` is a trap: a background refresh that fails
 * (rate limit exhausted, a transient network blip, a momentarily rejected
 * key) flips `status` to `'error'`, and the next persisted snapshot silently
 * drops the query — even though its last successful data is still sitting in
 * memory. Reload before the next successful fetch and there is nothing left
 * to restore, so the whole rate-limited history walk starts over.
 *
 * Persisting whenever data is present, regardless of the latest status, keeps
 * the last-known-good page set safe through a failed background refresh.
 */
export const shouldDehydrateQuery = (query: Query): boolean =>
  query.state.status === 'success' || query.state.data !== undefined
