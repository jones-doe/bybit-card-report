import {
  isRateLimited,
  PAGE_LIMIT,
  queryAssetRecords,
  type CardAssetRecord,
  type CardAssetRecordsResult,
  type Credentials,
} from '@/requests'
import { sleep } from './sleep'

const MAX_PAGES = 500

/** Pacing between pages. Grows after every rate-limit hit and never shrinks. */
const BASE_PAGE_DELAY_MS = 350
const MAX_PAGE_DELAY_MS = 5_000
const PAGE_DELAY_GROWTH = 1.8

/** Backoff for a page that was actually rejected. */
const MAX_RETRIES = 7
const BASE_BACKOFF_MS = 1_500
const MAX_BACKOFF_MS = 60_000

export interface FetchProgress {
  page: number
  fetched: number
  total: number | null
  /** Set while backing off after a rate-limit rejection. */
  retry?: { attempt: number; secondsLeft: number }
}

export interface FetchOptions {
  credentials: Credentials
  onProgress?: (progress: FetchProgress) => void
  signal?: AbortSignal
  /** Extra request fields, merged over the defaults. */
  params?: Record<string, unknown>
}

/**
 * Walks every page sequentially and returns the full history at once — callers
 * aggregate only after the whole set has landed.
 *
 * The endpoint rate-limits hard, so pacing is adaptive: every 10006 both backs
 * the current page off and permanently slows the gap between later pages.
 */
export async function fetchAllAssetRecords({
  credentials,
  onProgress,
  signal,
  params,
}: FetchOptions): Promise<CardAssetRecord[]> {
  const all: CardAssetRecord[] = []
  let total: number | null = null
  let pageDelay = BASE_PAGE_DELAY_MS

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    let result: CardAssetRecordsResult | null = null

    for (let attempt = 0; ; attempt++) {
      try {
        result = await queryAssetRecords(
          credentials,
          {
            page,
            limit: PAGE_LIMIT,
            status_code: '1',
            // Undocumented value: the docs list SIDE_QUERY_AUTH /
            // SIDE_QUERY_FINANCIAL / SIDE_QUERY_REFUND, but _ALL is what the web
            // app sends and the only one returning purchases and refunds together.
            type: 'SIDE_QUERY_FINANCIAL_ALL',
            ...params,
          },
          signal,
        )
        break
      } catch (error) {
        if (!isRateLimited(error) || attempt >= MAX_RETRIES) throw error

        // Slow every later page down too — one 10006 means the whole walk is
        // going faster than this key is allowed to.
        pageDelay = Math.min(Math.round(pageDelay * PAGE_DELAY_GROWTH), MAX_PAGE_DELAY_MS)

        const backoff = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS)
        const untilReset = error.resetAt ? error.resetAt - Date.now() + 500 : 0
        const waitMs = Math.max(backoff, untilReset)

        // Emit a ticking countdown so the UI can explain the pause.
        const startedAt = Date.now()
        for (;;) {
          const left = waitMs - (Date.now() - startedAt)
          if (left <= 0) break
          onProgress?.({
            page,
            fetched: all.length,
            total,
            retry: { attempt: attempt + 1, secondsLeft: Math.ceil(left / 1000) },
          })
          await sleep(Math.min(1000, left), signal)
        }
      }
    }

    const batch = Array.isArray(result?.data) ? result.data : []
    all.push(...batch)
    // Sent as a string on some responses, so coerce rather than typeof-check.
    const reported = Number(result?.totalCount)
    if (Number.isFinite(reported) && reported >= 0) total = reported
    onProgress?.({ page, fetched: all.length, total })

    const reachedTotal = total !== null && all.length >= total
    if (batch.length < PAGE_LIMIT || reachedTotal) break

    await sleep(pageDelay, signal)
  }

  return all
}
