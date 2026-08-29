import type { Txn } from '@/lib/types'
import { CATEGORY_SLOTS, NO_CATEGORY } from './constants'

export const buildCategoryOrder = (txns: Txn[]): Map<string, number> => {
  const totals = txns
    .filter((t): t is Txn & { usd: number } => t.usd !== null && t.usd >= 0)
    .reduce((acc, t) => {
      const name = t.category || NO_CATEGORY
      acc.set(name, (acc.get(name) ?? 0) + t.usd)
      return acc
    }, new Map<string, number>())

  const order = new Map<string, number>()
  ;[...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, CATEGORY_SLOTS)
    .forEach(([name], index) => order.set(name, index + 1))
  return order
}
