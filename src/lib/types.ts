/** Raw record as returned by POST /v5/card/transaction/query-asset-records. */
import type { TxnDirection } from './side'

export interface CardAssetRecord {
  pan4?: string
  pan6?: string
  tradeStatus?: string
  side?: string
  basicAmount?: string
  basicCurrency?: string
  transactionAmount?: string
  transactionCurrency?: string
  transactionCurrencyAmount?: string
  txnCreate?: number
  merchCountry?: string
  merchCity?: string
  merchName?: string
  txnId?: string
  declinedReason?: string
  totalFees?: string
  uid?: number
  fxPad?: string
  interchangeFee?: string
  billAmount?: string
  paidAmount?: string
  paidCurrency?: string
  bonusAmount?: string
  foreignTransactionFee?: string
  totalTax?: string
  paidFiat?: string
  withdrawalFee?: string
  status?: string
  orderNo?: string
  mccCode?: string
  merchCategoryDesc?: string
  [key: string]: unknown
}

export interface CardAssetRecordsResult {
  pageSize: number
  pageNo: number
  totalCount: number
  data: CardAssetRecord[]
}

export interface BybitEnvelope<T> {
  retCode: number
  retMsg: string
  result: T
  retExtInfo?: unknown
  time?: number
}

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
  status: string
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
