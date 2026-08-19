import type { CategoryStat, MerchantStat, MonthStat } from '@/lib/types'
import { NO_CATEGORY } from './constants'

export const buildMonthCategories = (
  month: MonthStat,
  order: Map<string, number>,
): CategoryStat[] => {
  const acc = new Map<string, CategoryStat>()
  const merchants = new Map<string, Map<string, MerchantStat>>()

  for (const day of month.days) {
    for (const t of day.txns) {
      if (t.usd === null || t.direction === 'hold') continue
      // Kept under its own name even outside the top 7 — the table names every
      // category, only the stacked bar folds the tail into "Прочее".
      const name = t.category || NO_CATEGORY
      const slot = order.get(name) ?? 0

      let stat = acc.get(name)
      if (!stat) {
        stat = { name, slot, spend: 0, refunds: 0, count: 0, share: 0, merchants: [] }
        acc.set(name, stat)
        merchants.set(name, new Map())
      }

      const byMerchant = merchants.get(name)!
      const merchantName = t.merchant || '—'
      let merchant = byMerchant.get(merchantName)
      if (!merchant) {
        merchant = { name: merchantName, spend: 0, refunds: 0, count: 0, share: 0 }
        byMerchant.set(merchantName, merchant)
      }

      // Only purchases are counted here: the refund is reported on its own
      // row, so counting it in its category too would double it.
      if (t.usd >= 0) {
        stat.spend += t.usd
        stat.count += 1
        merchant.spend += t.usd
        merchant.count += 1
      } else {
        stat.refunds += -t.usd
        merchant.refunds += -t.usd
      }
    }
  }

  const stats = [...acc.values()]
  for (const stat of stats) {
    stat.share = month.spend > 0 ? stat.spend / month.spend : 0
    stat.merchants = [...(merchants.get(stat.name)?.values() ?? [])]
      .map((m) => ({ ...m, share: stat.spend > 0 ? m.spend / stat.spend : 0 }))
      .sort((a, b) => b.spend - a.spend)
  }
  return stats.sort((a, b) => b.spend - a.spend)
}
