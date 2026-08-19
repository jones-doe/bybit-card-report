import { sideDirection, type TxnDirection } from '@/lib/side'
import type { CardAssetRecord } from '@/requests/queryAssetRecords'

/** Fallback only: used when `side` carries a code we do not know. */
const REFUND_RE = /refund|reversal|repay|cashback|credit|return/i

/**
 * `side` is the authoritative signal — a documented numeric code. The old text
 * heuristic stays only for codes outside the documented set, where a negative
 * amount or a wordy status is all we have to go on.
 */
export function directionOf(r: CardAssetRecord, rawUsd: number | null): TxnDirection {
  const documented = sideDirection(r.side)
  if (documented) return documented

  const flags = `${r.side ?? ''} ${r.status ?? ''} ${r.tradeStatus ?? ''} ${r.type ?? ''}`
  if (REFUND_RE.test(flags) || (rawUsd !== null && rawUsd < 0)) return 'refund'
  return 'spend'
}
