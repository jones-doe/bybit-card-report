import type { CardAssetRecord } from '@/requests/queryAssetRecords'

const CREDENTIALS_KEY = 'bybit-card-report:credentials'
const CACHE_KEY = 'bybit-card-report:query-cache'

/** Default key used when installing the fixtures — matches nothing real. */
export const FIXTURE_API_KEY = 'FIXTURE00000000000000'

/**
 * Loads dev/fixtures/assetRecords.json straight into localStorage, in the
 * exact shape react-query persists to. Skips the app entirely — no fetch, no
 * signing, no rate limiting — so a reload renders the fixture immediately.
 *
 * Usage in the browser console (or javascript_tool):
 *   const { installFixtures } = await import('/dev/fixtures/install.ts')
 *   await installFixtures()
 *   location.reload()
 */
export const installFixtures = async (apiKey: string = FIXTURE_API_KEY): Promise<number> => {
  const records: CardAssetRecord[] = await fetch('/dev/fixtures/assetRecords.json').then((r) => r.json())

  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ apiKey, apiSecret: 'fixture' }))

  const now = Date.now()
  const queryKey = ['assetRecords', apiKey]
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      buster: 'v1',
      timestamp: now,
      clientState: {
        mutations: [],
        queries: [
          {
            dehydratedAt: now,
            queryKey,
            queryHash: JSON.stringify(queryKey),
            queryType: 'infinite',
            state: {
              data: {
                pages: [{ pageSize: '100', pageNo: '1', totalCount: String(records.length), data: records }],
                pageParams: [1],
              },
              dataUpdateCount: 1,
              dataUpdatedAt: now,
              error: null,
              errorUpdateCount: 0,
              errorUpdatedAt: 0,
              fetchFailureCount: 0,
              fetchFailureReason: null,
              fetchMeta: null,
              isInvalidated: false,
              status: 'success',
              fetchStatus: 'idle',
            },
          },
        ],
      },
    }),
  )

  return records.length
}

/** Removes whatever installFixtures wrote — leaves everything else untouched. */
export const clearFixtures = () => {
  localStorage.removeItem(CREDENTIALS_KEY)
  localStorage.removeItem(CACHE_KEY)
}
