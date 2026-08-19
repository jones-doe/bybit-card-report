import type { DayStat, Txn } from '@/lib/types'

export const buildDays = (txns: Txn[]): Map<string, DayStat> => {
  const days = new Map<string, DayStat>()
  for (const t of txns) {
    let day = days.get(t.dateKey)
    if (!day) {
      day = {
        dateKey: t.dateKey,
        spend: 0,
        refunds: 0,
        net: 0,
        count: 0,
        spendCount: 0,
        txns: [],
      }
      days.set(t.dateKey, day)
    }
    day.count += 1
    day.txns.push(t)
    if (t.usd === null || t.direction === 'hold') continue
    if (t.usd >= 0) {
      day.spend += t.usd
      day.spendCount += 1
    } else {
      day.refunds += -t.usd
    }
    day.net = day.spend - day.refunds
  }
  return days
}
