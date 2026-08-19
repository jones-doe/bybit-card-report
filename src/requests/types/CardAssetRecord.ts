/**
 * One card transaction exactly as the server sends it — untouched, including
 * the quirks: numbers arrive as strings, amounts may use scientific notation
 * (`0E-8`), `merchName` and `merchCity` are padded with trailing spaces, and
 * `side`, `status`, `tradeStatus` are numeric codes.
 *
 * https://bybit-exchange.github.io/docs/v5/bybit-card/asset-records
 */
export interface CardAssetRecord {
  pan4?: string
  pan6?: string
  /** `0` In_Progress, `1` Completed, `2` Declined, `3` Reversal. */
  tradeStatus?: string
  /** Operation code: `3` Transaction, `5` Refund, `13` ATM Withdrawal, … */
  side?: string
  basicAmount?: string
  basicCurrency?: string
  transactionAmount?: string
  transactionCurrency?: string
  transactionCurrencyAmount?: string
  txnCreate?: number | string
  merchCountry?: string
  merchCity?: string
  merchName?: string
  txnId?: string
  declinedReason?: string
  totalFees?: string
  uid?: number | string
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
  /** `-1` Init, `0` Pending, `1` Success, `2` Fail. */
  status?: string
  orderNo?: string
  mccCode?: string
  merchCategoryDesc?: string
  [key: string]: unknown
}
