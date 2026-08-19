import type { CardAssetRecord } from '@/requests/queryAssetRecords'

export interface AssetRecordsQuery {
  /** Every page flattened. Complete only once `isComplete` is true. */
  records: CardAssetRecord[]
  /** totalCount as reported by the last page, when it reported one. */
  total: number | null
  pagesFetched: number
  /** No data yet — first page still in flight. */
  isLoading: boolean
  /** Any request in flight, including the walk over later pages. */
  isFetching: boolean
  /** The whole history has landed. */
  isComplete: boolean
  /** A request failed and is being retried; counts the failures so far. */
  failureCount: number
  error: Error | null
  fetchedAt: number | null
  refetch: () => void
}
