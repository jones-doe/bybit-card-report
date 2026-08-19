import { formatUsd, pluralTxn } from '@/lib/format'
import type { CategoryStat } from '@/lib/types'
import { percent } from './utils'

/** How many merchants a category names before folding the rest. */
const MERCHANT_LIMIT = 8

export const MerchantList = ({ category }: { category: CategoryStat }) => {
  const shown = category.merchants.slice(0, MERCHANT_LIMIT)
  const rest = category.merchants.slice(MERCHANT_LIMIT)
  const restSpend = rest.reduce((sum, m) => sum + m.spend, 0)
  const max = Math.max(...category.merchants.map((m) => m.spend), 1)

  if (category.merchants.length === 0) return null

  return (
    <div className="border-border/60 mt-1 mb-2 ml-5 space-y-1 border-l pl-4">
      {shown.map((m) => (
        <div
          key={m.name}
          className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3"
        >
          <span className="text-muted-foreground truncate text-xs">{m.name}</span>

          <span className="flex h-3 items-center">
            <span
              className="h-1.5 rounded-r-[4px] opacity-70"
              style={{
                width: `${Math.max((m.spend / max) * 100, 1)}%`,
                backgroundColor: `var(--cat-${category.slot})`,
              }}
            />
          </span>

          <span className="flex items-baseline gap-3 text-right">
            <span className="text-muted-foreground w-10 text-xs tabular-nums">
              {percent(m.share)}
            </span>
            <span className="w-24 text-xs font-medium tabular-nums">{formatUsd(m.spend)}</span>
            <span className="text-muted-foreground w-20 text-xs tabular-nums">
              {m.count} {pluralTxn(m.count)}
              {m.refunds > 0 && (
                <span style={{ color: 'var(--heat-refund)' }}> · −{formatUsd(m.refunds)}</span>
              )}
            </span>
          </span>
        </div>
      ))}

      {rest.length > 0 && (
        <div className="text-muted-foreground grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate">ещё {rest.length}</span>
          <span />
          <span className="flex items-baseline gap-3 text-right">
            <span className="w-10" />
            <span className="w-24 tabular-nums">{formatUsd(restSpend)}</span>
            <span className="w-20" />
          </span>
        </div>
      )}
    </div>
  )
}
