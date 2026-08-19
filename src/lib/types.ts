// Display models. Everything the server sends lives in src/requests/types.
import type { CardAssetRecord } from '@/requests'
import type { TxnDirection } from './side'

/** A record normalised for statistics. All money is USD. */
export interface Txn {
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

export interface DayStat {
  dateKey: string
  spend: number
  refunds: number
  net: number
  count: number
  /** Purchases only — refunds and holds must not dilute an average cheque. */
  spendCount: number
  txns: Txn[]
}

export interface MonthStat {
  monthKey: string
  spend: number
  refunds: number
  net: number
  count: number
  spendCount: number
  activeDays: number
  avgCheck: number
  maxDay: DayStat | null
  days: DayStat[]
}
