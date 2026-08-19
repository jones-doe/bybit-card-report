export interface MerchantStat {
  name: string
  spend: number
  refunds: number
  count: number
  /** Share of the category this merchant sits in. */
  share: number
}
