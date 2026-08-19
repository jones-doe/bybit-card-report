import type { Txn } from './Txn'

export type DayStat = {
  dateKey: string
  spend: number
  refunds: number
  net: number
  count: number
  /** Purchases only — refunds and holds must not dilute an average cheque. */
  spendCount: number
  txns: Txn[]
}
