import type { DayStat, MonthStat } from '@/lib/types'
import { monthKeyOf } from './monthKeyOf'

export const buildMonths = (days: Map<string, DayStat>): MonthStat[] => {
  const months = new Map<string, MonthStat>()

  for (const day of days.values()) {
    const monthKey = monthKeyOf(day.dateKey)
    let month = months.get(monthKey)
    if (!month) {
      month = {
        monthKey,
        spend: 0,
        refunds: 0,
        net: 0,
        count: 0,
        spendCount: 0,
        activeDays: 0,
        avgCheck: 0,
        maxDay: null,
        days: [],
      }
      months.set(monthKey, month)
    }
    month.spend += day.spend
    month.refunds += day.refunds
    month.count += day.count
    month.spendCount += day.spendCount
    if (day.spend > 0) month.activeDays += 1
    month.days.push(day)
    if (!month.maxDay || day.spend > month.maxDay.spend) month.maxDay = day
  }

  for (const month of months.values()) {
    month.net = month.spend - month.refunds
    month.avgCheck = month.spendCount > 0 ? month.spend / month.spendCount : 0
    month.days.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }

  return [...months.values()].sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}
