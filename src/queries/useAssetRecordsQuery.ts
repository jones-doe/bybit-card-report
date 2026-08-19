import { useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { PAGE_LIMIT } from '@/requests'
import type { CardAssetRecord, Credentials } from '@/requests'
import { assetRecordsQueryKey } from './assetRecordsQueryKey'
import { fetchAssetRecordsPage } from './fetchAssetRecordsPage'

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

/**
 * The full card history. Pages are walked to the end because statistics are
 * computed over the whole set, never a prefix.
 *
 * Retries, backoff, caching and its persistence all belong to react-query — see
 * the client defaults in `queryClient.ts`.
 */
export function useAssetRecordsQuery(credentials: Credentials | null): AssetRecordsQuery {
  const query = useInfiniteQuery({
    queryKey: assetRecordsQueryKey(credentials?.apiKey),
    enabled: credentials !== null,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchAssetRecordsPage(credentials!, pageParam, signal),
    getNextPageParam: (lastPage, allPages) => {
      const batch = lastPage?.data ?? []
      if (batch.length < PAGE_LIMIT) return undefined

      const fetched = allPages.reduce((sum, page) => sum + (page?.data?.length ?? 0), 0)
      const total = Number(lastPage?.totalCount)
      if (Number.isFinite(total) && fetched >= total) return undefined

      return allPages.length + 1
    },
  })

  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage])

  const records = useMemo(
    () => query.data?.pages.flatMap((page) => page?.data ?? []) ?? [],
    [query.data],
  )

  const total = useMemo(() => {
    const pages = query.data?.pages
    const reported = Number(pages?.[pages.length - 1]?.totalCount)
    return Number.isFinite(reported) && reported >= 0 ? reported : null
  }, [query.data])

  return {
    records,
    total,
    pagesFetched: query.data?.pages.length ?? 0,
    isLoading: query.isPending && query.fetchStatus !== 'idle',
    isFetching: query.isFetching,
    isComplete: Boolean(query.data) && !hasNextPage && !query.isFetching,
    failureCount: query.failureCount,
    error: query.error,
    fetchedAt: query.dataUpdatedAt || null,
    refetch: () => void query.refetch(),
  }
}
