/**
 * Keyed by API key so switching keys switches caches. The secret is deliberately
 * absent: the cache is persisted to localStorage, and a key is enough to scope it.
 */
export const assetRecordsQueryKey = (apiKey: string | undefined) =>
  ['assetRecords', apiKey ?? null] as const
