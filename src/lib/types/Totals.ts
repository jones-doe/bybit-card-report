export type Totals = {
  spend: number
  refunds: number
  net: number
  count: number
  avgCheck: number
  fees: number
  activeDays: number
  avgPerActiveDay: number
  unresolvedCount: number
  /** Authorisations and requests — real records, but not settled money. */
  holdCount: number
  firstTs: number | null
  lastTs: number | null
}
