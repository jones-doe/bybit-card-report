import type { CategoryStat, MerchantStat, MonthStat, Txn } from '@/lib/types'
import { NO_CATEGORY } from './constants'

type CategoryAccumulator = {
  stat: CategoryStat
  merchants: Map<string, MerchantStat>
}

export const buildMonthCategories = (
  month: MonthStat,
  order: Map<string, number>,
): CategoryStat[] => {
  const byCategory = month.days
    .flatMap((day) => day.txns)
    .filter((t): t is Txn & { usd: number } => t.usd !== null && t.direction !== 'hold')
    .reduce((acc, t) => {
      // Kept under its own name even outside the top 7 — the table names every
      // category, only the stacked bar folds the tail into "Прочее".
      const name = t.category || NO_CATEGORY
      const slot = order.get(name) ?? 0

      const entry: CategoryAccumulator = acc.get(name) ?? {
        stat: { name, slot, spend: 0, refunds: 0, count: 0, share: 0, merchants: [] },
        merchants: new Map(),
      }
      acc.set(name, entry)

      const merchantName = t.merchant || '—'
      const merchant: MerchantStat = entry.merchants.get(merchantName) ?? {
        name: merchantName,
        spend: 0,
        refunds: 0,
        count: 0,
        share: 0,
      }
      entry.merchants.set(merchantName, merchant)

      // Only purchases are counted here: the refund is reported on its own
      // row, so counting it in its category too would double it.
      if (t.usd >= 0) {
        entry.stat.spend += t.usd
        entry.stat.count += 1
        merchant.spend += t.usd
        merchant.count += 1
      } else {
        entry.stat.refunds += -t.usd
        merchant.refunds += -t.usd
      }

      return acc
    }, new Map<string, CategoryAccumulator>())

  const stats = [...byCategory.values()].map(({ stat, merchants }) => {
    stat.share = month.spend > 0 ? stat.spend / month.spend : 0
    stat.merchants = [...merchants.values()]
      .map((m) => ({ ...m, share: stat.spend > 0 ? m.spend / stat.spend : 0 }))
      .sort((a, b) => b.spend - a.spend)
    return stat
  })

  return stats.sort((a, b) => b.spend - a.spend)
}
