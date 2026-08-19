/**
 * Request body of query-asset-records, spelled exactly as it goes on the wire —
 * note `status_code` is snake_case while the rest is camelCase.
 */
export type QueryAssetRecordsParams = {
  page: number
  /** Server maximum is 100. */
  limit: number
  /** `0` Pending, `1` Cleared, `2` Declined. */
  status_code?: string
  /** `SIDE_QUERY_AUTH` | `SIDE_QUERY_FINANCIAL` | `SIDE_QUERY_REFUND` | `SIDE_QUERY_FINANCIAL_ALL`. */
  type?: string
  pan4?: string
  createBeginTime?: number
  createEndTime?: number
  merchName?: string
  txnId?: string
  cardToken?: string
  orderNo?: string
}
