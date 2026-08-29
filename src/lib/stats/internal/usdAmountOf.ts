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
  const usd = pairs
    .filter(([, currency]) => String(currency ?? '').toUpperCase() === 'USD')
    .map(([amount]) => toNumber(amount))
    .find((n) => n !== null)
  return usd ?? null
}
