import { mccDescription, mccGroup, normalizeMcc } from './mcc'
import type { CardAssetRecord, DayStat, MonthStat, Txn } from './types'

const REFUND_RE = /refund|reversal|repay|cashback|credit|return/i

export const NO_CATEGORY = 'Без категории'

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function toMillis(value: unknown): number | null {
  const n = toNumber(value)
  if (n === null || n <= 0) return null
  // txnCreate arrives in seconds on some records and milliseconds on others.
  return n < 1e12 ? Math.round(n * 1000) : Math.round(n)
}

export function dateKeyOf(ts: number): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const monthKeyOf = (dateKey: string) => dateKey.slice(0, 7)

/** Picks the USD figure out of the several amount/currency pairs on a record. */
function usdAmountOf(r: CardAssetRecord): number | null {
  const pairs: Array<[unknown, unknown]> = [
    [r.basicAmount, r.basicCurrency],
    [r.billAmount, r.basicCurrency],
    [r.transactionAmount, r.transactionCurrency],
    [r.paidAmount, r.paidCurrency],
  ]
  for (const [amount, currency] of pairs) {
    if (String(currency ?? '').toUpperCase() !== 'USD') continue
    const n = toNumber(amount)
    if (n !== null) return n
  }
  return null
}

/**
 * Turns whatever the record carries — an MCC, a text description, or nothing —
 * into a group for the charts plus the precise description for the table.
 */
function categorize(r: CardAssetRecord): {
  category: string
  categoryDetail: string
  mcc: string | null
} {
  const rawDesc = String(r.merchCategoryDesc ?? '').trim()
  // A numeric merchCategoryDesc is a code, not a description.
  const descIsCode = normalizeMcc(rawDesc) !== null
  const description = descIsCode ? '' : rawDesc
  const mcc = normalizeMcc(r.mccCode) ?? normalizeMcc(rawDesc)

  const group = mcc ? mccGroup(mcc) : null
  const detail = description || (mcc ? (mccDescription(mcc) ?? '') : '')

  return {
    category: group || description || NO_CATEGORY,
    categoryDetail: detail,
    mcc,
  }
}

export function normalize(records: CardAssetRecord[]): Txn[] {
  const txns: Txn[] = []

  for (const [index, r] of records.entries()) {
    const ts = toMillis(r.txnCreate)
    if (ts === null) continue

    const { category, categoryDetail, mcc } = categorize(r)
    const rawUsd = usdAmountOf(r)
    const flags = `${r.side ?? ''} ${r.status ?? ''} ${r.tradeStatus ?? ''}`
    const isRefund = REFUND_RE.test(flags) || (rawUsd !== null && rawUsd < 0)
    const magnitude = rawUsd === null ? null : Math.abs(rawUsd)
    const dateKey = dateKeyOf(ts)

    txns.push({
      id: String(r.txnId || r.orderNo || `${ts}-${index}`),
      ts,
      dateKey,
      monthKey: monthKeyOf(dateKey),
      usd: magnitude === null ? null : isRefund ? -magnitude : magnitude,
      sourceCurrency: String(r.transactionCurrency || r.basicCurrency || ''),
      sourceAmount: toNumber(r.transactionAmount) ?? toNumber(r.basicAmount),
      merchant: String(r.merchName || '—').trim(),
      category,
      categoryDetail,
      mcc,
      country: String(r.merchCountry || '').trim(),
      city: String(r.merchCity || '').trim(),
      status: String(r.status || r.tradeStatus || '').trim(),
      side: String(r.side || '').trim(),
      fees: toNumber(r.totalFees) ?? 0,
      isRefund,
      raw: r,
    })
  }

  return txns.sort((a, b) => b.ts - a.ts)
}

export function buildDays(txns: Txn[]): Map<string, DayStat> {
  const days = new Map<string, DayStat>()
  for (const t of txns) {
    let day = days.get(t.dateKey)
    if (!day) {
      day = { dateKey: t.dateKey, spend: 0, refunds: 0, net: 0, count: 0, txns: [] }
      days.set(t.dateKey, day)
    }
    day.count += 1
    day.txns.push(t)
    if (t.usd === null) continue
    if (t.usd >= 0) day.spend += t.usd
    else day.refunds += -t.usd
    day.net = day.spend - day.refunds
  }
  return days
}

export function buildMonths(days: Map<string, DayStat>): MonthStat[] {
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
    month.activeDays += 1
    month.days.push(day)
    if (!month.maxDay || day.spend > month.maxDay.spend) month.maxDay = day
  }

  for (const month of months.values()) {
    month.net = month.spend - month.refunds
    month.avgCheck = month.count > 0 ? month.spend / month.count : 0
    month.days.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }

  return [...months.values()].sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

export interface Totals {
  spend: number
  refunds: number
  net: number
  count: number
  avgCheck: number
  fees: number
  activeDays: number
  avgPerActiveDay: number
  unresolvedCount: number
  firstTs: number | null
  lastTs: number | null
}

export function buildTotals(txns: Txn[], days: Map<string, DayStat>): Totals {
  let spend = 0
  let refunds = 0
  let fees = 0
  let spendCount = 0
  let unresolvedCount = 0
  let firstTs: number | null = null
  let lastTs: number | null = null

  for (const t of txns) {
    fees += t.fees
    if (firstTs === null || t.ts < firstTs) firstTs = t.ts
    if (lastTs === null || t.ts > lastTs) lastTs = t.ts
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
    firstTs,
    lastTs,
  }
}

/**
 * Quantile-bucketed scale for the calendar: five steps over the days that had
 * any spend, so a handful of huge days can't flatten everything else to step 1.
 */
export function makeHeatScale(values: number[]) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return { level: () => 0, thresholds: [] as number[] }

  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
  const thresholds = [at(0.2), at(0.4), at(0.6), at(0.8)]

  const level = (value: number) => {
    if (value <= 0) return 0
    let step = 1
    for (const threshold of thresholds) {
      if (value > threshold) step += 1
    }
    return Math.min(step, 5)
  }

  return { level, thresholds }
}

/**
 * Categories are coloured from a fixed 7-slot categorical palette assigned once
 * across the whole history — a category keeps its colour in every month, so the
 * colour follows the category and never its rank inside one month. Everything
 * past the top 7 folds into a neutral "Прочее" bucket rather than getting a
 * generated hue.
 */
export const CATEGORY_SLOTS = 7
export const OTHER_CATEGORY = 'Прочее'

export interface CategoryStat {
  name: string
  /** 1…7 for a named category, 0 for the neutral "Прочее" bucket. */
  slot: number
  spend: number
  refunds: number
  count: number
  share: number
}

export function buildCategoryOrder(txns: Txn[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const t of txns) {
    if (t.usd === null || t.usd < 0) continue
    const name = t.category || NO_CATEGORY
    totals.set(name, (totals.get(name) ?? 0) + t.usd)
  }

  const order = new Map<string, number>()
  ;[...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, CATEGORY_SLOTS)
    .forEach(([name], index) => order.set(name, index + 1))
  return order
}

export function buildMonthCategories(
  month: MonthStat,
  order: Map<string, number>,
): CategoryStat[] {
  const acc = new Map<string, CategoryStat>()

  for (const day of month.days) {
    for (const t of day.txns) {
      if (t.usd === null) continue
      // Kept under its own name even outside the top 7 — the table names every
      // category, only the stacked bar folds the tail into "Прочее".
      const name = t.category || NO_CATEGORY
      const slot = order.get(name) ?? 0

      let stat = acc.get(name)
      if (!stat) {
        stat = { name, slot, spend: 0, refunds: 0, count: 0, share: 0 }
        acc.set(name, stat)
      }
      stat.count += 1
      if (t.usd >= 0) stat.spend += t.usd
      else stat.refunds += -t.usd
    }
  }

  const stats = [...acc.values()]
  for (const stat of stats) stat.share = month.spend > 0 ? stat.spend / month.spend : 0
  return stats.sort((a, b) => b.spend - a.spend)
}
