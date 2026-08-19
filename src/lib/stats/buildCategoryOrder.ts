import type { Txn } from '@/lib/types'
import { CATEGORY_SLOTS, NO_CATEGORY } from './constants'

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
