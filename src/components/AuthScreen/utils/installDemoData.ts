import { credentialsStore } from '@/lib/credentials'
import { queryClient } from '@/queries/client'
import { assetRecordsQueryKey } from '@/queries/useAssetRecordsQuery'
import type { CardAssetRecord } from '@/requests/queryAssetRecords'

/** Key for the demo session — never a real Bybit credential. */
const DEMO_API_KEY = 'DEMO0000000000000000'

/**
 * Loads dev/fixtures/assetRecords.json straight into the running app: seeds
 * the query cache, then logs in. No reload, no network call to Bybit —
 * credentialsStore flips the screen to Dashboard reactively, and the seeded
 * data is fresh enough (just written) that the usual staleTime/refetchOnMount
 * check leaves it alone instead of trying to refresh it.
 *
 * Dev-only by construction, not just by the button that calls it: the fetch
 * below is a plain runtime request, not a module import, so dev/fixtures/*
 * is never pulled into the production bundle — it 404s outside `vite dev`
 * and nothing here is reachable unless this function is actually called.
 */
export const installDemoData = async (): Promise<void> => {
  const records: CardAssetRecord[] = await fetch('/dev/fixtures/assetRecords.json').then((r) =>
    r.json(),
  )

  queryClient.setQueryData(assetRecordsQueryKey(DEMO_API_KEY), {
    pages: [
      {
        pageSize: String(records.length),
        pageNo: '1',
        totalCount: String(records.length),
        data: records,
      },
    ],
    pageParams: [1],
  })

  credentialsStore.set({ apiKey: DEMO_API_KEY, apiSecret: 'demo' })
}
