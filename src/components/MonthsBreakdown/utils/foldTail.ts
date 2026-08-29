import type { CategoryStat, MerchantStat } from '@/lib/types'

/** Label for the folded tail of small categories. */
const OTHER_CATEGORY = 'Прочее'

export const foldTail = (
  categories: CategoryStat[],
  keep: (c: CategoryStat, index: number) => boolean,
): CategoryStat[] => {
  const kept = categories.filter((c, i) => keep(c, i) && c.spend > 0)
  const tail = categories.filter((c, i) => !keep(c, i))
  if (tail.length === 0) return kept

  const spend = tail.reduce((sum, c) => sum + c.spend, 0)

  // Merchants of the folded categories are merged, so opening "Прочее" still
  // answers where that money went.
  const merged = tail
    .flatMap((category) => category.merchants)
    .reduce((acc, m) => {
      const existing = acc.get(m.name)
      acc.set(
        m.name,
        existing
          ? {
              ...existing,
              spend: existing.spend + m.spend,
              refunds: existing.refunds + m.refunds,
              count: existing.count + m.count,
            }
          : { ...m },
      )
      return acc
    }, new Map<string, MerchantStat>())

  const folded: CategoryStat = {
    name: tail.length > 1 ? `${OTHER_CATEGORY} (${tail.length})` : tail[0].name,
    slot: 0,
    spend,
    refunds: tail.reduce((sum, c) => sum + c.refunds, 0),
    count: tail.reduce((sum, c) => sum + c.count, 0),
    share: tail.reduce((sum, c) => sum + c.share, 0),
    merchants: [...merged.values()]
      .map((m) => ({ ...m, share: spend > 0 ? m.spend / spend : 0 }))
      .sort((a, b) => b.spend - a.spend),
  }
  return folded.spend > 0 ? [...kept, folded].sort((a, b) => b.spend - a.spend) : kept
}
