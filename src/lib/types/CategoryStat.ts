import type { MerchantStat } from './MerchantStat'

export interface CategoryStat {
  name: string
  /** 1…7 for a named category, 0 for the neutral "Прочее" bucket. */
  slot: number
  spend: number
  refunds: number
  count: number
  share: number
  /** Where inside the category the money actually went, biggest first. */
  merchants: MerchantStat[]
}
