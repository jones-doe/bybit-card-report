import type { DayStat, Totals, Txn } from '@/lib/types'

type RunningTotals = {
  spend: number
  refunds: number
  fees: number
  spendCount: number
  unresolvedCount: number
  holdCount: number
  firstTs: number | null
  lastTs: number | null
}

const initialTotals: RunningTotals = {
  spend: 0,
  refunds: 0,
  fees: 0,
  spendCount: 0,
  unresolvedCount: 0,
  holdCount: 0,
  firstTs: null,
  lastTs: null,
}

export const buildTotals = (txns: Txn[], days: Map<string, DayStat>): Totals => {
  const running = txns.reduce<RunningTotals>((acc, t) => {
    const fees = acc.fees + t.fees
    const firstTs = acc.firstTs === null || t.ts < acc.firstTs ? t.ts : acc.firstTs
    const lastTs = acc.lastTs === null || t.ts > acc.lastTs ? t.ts : acc.lastTs
    const base = { ...acc, fees, firstTs, lastTs }

    if (t.direction === 'hold') return { ...base, holdCount: base.holdCount + 1 }
    if (t.usd === null) return { ...base, unresolvedCount: base.unresolvedCount + 1 }
    return t.usd >= 0
      ? { ...base, spend: base.spend + t.usd, spendCount: base.spendCount + 1 }
      : { ...base, refunds: base.refunds - t.usd }
  }, initialTotals)

  const activeDays = [...days.values()].filter((d) => d.spend > 0).length

  return {
    spend: running.spend,
    refunds: running.refunds,
    net: running.spend - running.refunds,
    count: txns.length,
    avgCheck: running.spendCount > 0 ? running.spend / running.spendCount : 0,
    fees: running.fees,
    activeDays,
    avgPerActiveDay: activeDays > 0 ? running.spend / activeDays : 0,
    unresolvedCount: running.unresolvedCount,
    holdCount: running.holdCount,
    firstTs: running.firstTs,
    lastTs: running.lastTs,
  }
}
