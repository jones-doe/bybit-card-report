import type { CardAssetRecord } from '@/requests/queryAssetRecords'
import { toNumber } from './toNumber'

/** Picks the USD figure out of the several amount/currency pairs on a record. */
export const usdAmountOf = (r: CardAssetRecord): number | null => {
  const pairs: Array<[unknown, unknown]> = [
    [r.basicAmount, r.basicCurrency],
    [r.billAmount, r.basicCurrency],
    [r.transactionAmount, r.transactionCurrency],
    [r.paidAmount, r.paidCurrency],
  ]
  for (const [amount, currency] of pairs) {
    if (String(currency ?? '').toUpperCase() !== 'USD') continue
    const n = toNumber(amount)
    if (n !== null) return n
  }
  return null
}
