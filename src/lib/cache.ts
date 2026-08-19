import type { CardAssetRecord } from '@/requests'

const KEY = 'bybit-card-report:records'

export interface CachedRecords {
  fetchedAt: number
  records: CardAssetRecord[]
}

export function loadCachedRecords(): CachedRecords | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachedRecords>
    if (!Array.isArray(parsed.records)) return null
    return { fetchedAt: parsed.fetchedAt ?? 0, records: parsed.records }
  } catch {
    return null
  }
}

export function saveCachedRecords(records: CardAssetRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ fetchedAt: Date.now(), records }))
  } catch {
    // Quota exceeded — the report still works, it just won't survive a reload.
  }
}

export function clearCachedRecords() {
  localStorage.removeItem(KEY)
}
