import { sleep } from '@/lib/sleep'
import { PAGE_LIMIT, queryAssetRecords } from '@/requests'
import type { CardAssetRecordsResult, Credentials } from '@/requests'

/**
 * Gap before every page after the first. This is throttling, not retrying — it
 * keeps the walk under the limit so the retry path stays the exception.
 */
const PAGE_DELAY_MS = 350

/** One page of history, with the defaults this app always asks for. */
export async function fetchAssetRecordsPage(
  credentials: Credentials,
  page: number,
  signal?: AbortSignal,
): Promise<CardAssetRecordsResult> {
  if (page > 1) await sleep(PAGE_DELAY_MS, signal)

  return queryAssetRecords(
    credentials,
    {
      page,
      limit: PAGE_LIMIT,
      status_code: '1',
      // Undocumented value: the docs list SIDE_QUERY_AUTH / SIDE_QUERY_FINANCIAL /
      // SIDE_QUERY_REFUND, but _ALL is what the web app sends and the only one
      // returning purchases and refunds together.
      type: 'SIDE_QUERY_FINANCIAL_ALL',
    },
    signal,
  )
}
