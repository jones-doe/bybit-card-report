import type { DayStat, Totals, Txn } from '@/lib/types'

export const buildTotals = (txns: Txn[], days: Map<string, DayStat>): Totals => {
  let spend = 0
  let refunds = 0
  let fees = 0
  let spendCount = 0
  let unresolvedCount = 0
  let holdCount = 0
  let firstTs: number | null = null
  let lastTs: number | null = null

  for (const t of txns) {
    fees += t.fees
    if (firstTs === null || t.ts < firstTs) firstTs = t.ts
    if (lastTs === null || t.ts > lastTs) lastTs = t.ts
    if (t.direction === 'hold') {
      holdCount += 1
      continue
    }
    if (t.usd === null) {
      unresolvedCount += 1
      continue
    }
    if (t.usd >= 0) {
      spend += t.usd
      spendCount += 1
    } else {
      refunds += -t.usd
    }
  }

  const activeDays = [...days.values()].filter((d) => d.spend > 0).length
  return {
    spend,
    refunds,
    net: spend - refunds,
    count: txns.length,
    avgCheck: spendCount > 0 ? spend / spendCount : 0,
    fees,
    activeDays,
    avgPerActiveDay: activeDays > 0 ? spend / activeDays : 0,
    unresolvedCount,
    holdCount,
    firstTs,
    lastTs,
  }
}
