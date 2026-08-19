import type { DayStat } from './DayStat'

export type MonthStat = {
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
