import type { CardAssetRecord } from '@/requests/queryAssetRecords'
import type { TxnDirection } from '@/lib/side'

/** A record normalised for statistics. All money is USD. */
export type Txn = {
  id: string
  ts: number
  dateKey: string
  monthKey: string
  /** Signed USD: positive = money out (spend), negative = money in (refund). */
  usd: number | null
  /** Currency the amount was actually charged in, for transparency. */
  sourceCurrency: string
  sourceAmount: number | null
  merchant: string
  /** Spending group the charts aggregate on. */
  category: string
  /** Precise MCC description or the raw text category, when there is one. */
  categoryDetail: string
  mcc: string | null
  country: string
  city: string
  /** Raw `status` code as sent. */
  status: string
  /** Decoded `status`, e.g. "Успешно". */
  statusLabel: string
  /** Decoded `tradeStatus`, e.g. "Завершена". */
  tradeStatusLabel: string
  side: string
  /** Human label for the documented `side` code, empty when unknown. */
  sideLabel: string
  direction: TxnDirection
  fees: number
  isRefund: boolean
  raw: CardAssetRecord
}
