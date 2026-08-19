import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMonthKey, formatUsd, pluralTxn } from '@/lib/format'
import { buildMonthCategories } from '@/lib/stats'
import type { CategoryStat, MonthStat } from '@/lib/types'
import { MonthPanel } from './MonthPanel'
import { foldTail } from './utils'

type MonthsBreakdownProps = {
  months: MonthStat[]
  categoryOrder: Map<string, number>
  onOpenTransactions: (monthKey: string) => void
}

export const MonthsBreakdown = ({
  months,
  categoryOrder,
  onOpenTransactions,
}: MonthsBreakdownProps) => {
  // The newest month starts open — the "where is the money going" answer should
  // be on screen without a click.
  const [expanded, setExpanded] = useState<string | null>(months[0]?.monthKey ?? null)

  const byMonth = useMemo(() => {
    const map = new Map<string, CategoryStat[]>()
    for (const month of months) map.set(month.monthKey, buildMonthCategories(month, categoryOrder))
    return map
  }, [months, categoryOrder])

  if (months.length === 0) {
    return <p className="text-muted-foreground text-sm">Нет данных за период.</p>
  }

  const max = Math.max(...months.map((m) => m.net), 1)
  const legend = [...categoryOrder.entries()].sort((a, b) => a[1] - b[1])

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Траты по месяцам и категориям</CardTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {legend.map(([name, slot]) => (
            <span key={name} className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: `var(--cat-${slot})` }}
              />
              {name}
            </span>
          ))}
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: 'var(--cat-0)' }}
            />
            Прочее
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {months.map((month) => {
          const categories = byMonth.get(month.monthKey) ?? []
          const isOpen = expanded === month.monthKey

          return (
            <div key={month.monthKey}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : month.monthKey)}
                aria-expanded={isOpen}
                className="hover:bg-accent/60 focus-visible:ring-ring grid w-full grid-cols-[1rem_minmax(0,8rem)_1fr_auto] items-center gap-3 rounded-md px-2 py-2 text-left transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <ChevronDown
                  className={`text-muted-foreground size-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                />

                <span className="truncate text-sm font-medium capitalize">
                  {formatMonthKey(month.monthKey)}
                </span>

                <span className="flex h-5 items-center">
                  <span
                    className="flex h-2.5 gap-[2px] [&>*:last-child]:rounded-r-[4px]"
                    // Length is the net figure; the segments inside keep the
                    // proportions of what was actually spent.
                    style={{ width: `${Math.max((month.net / max) * 100, 1.5)}%` }}
                  >
                    {foldTail(categories, (c) => c.slot > 0).map((c) => (
                        <span
                          key={c.name}
                          className="min-w-[2px]"
                          style={{
                            flexBasis: `${c.share * 100}%`,
                            backgroundColor: `var(--cat-${c.slot})`,
                          }}
                        />
                    ))}
                  </span>
                </span>

                <span className="text-right">
                  <span className="block text-sm font-semibold tabular-nums">
                    {formatUsd(month.net)}
                  </span>
                  <span className="text-muted-foreground block text-xs tabular-nums">
                    {month.count} {pluralTxn(month.count)} · ср. {formatUsd(month.avgCheck)}
                    {month.refunds > 0 && (
                      <span style={{ color: 'var(--heat-refund)' }}>
                        {' '}
                        · возвраты {formatUsd(month.refunds)}
                      </span>
                    )}
                  </span>
                </span>
              </button>

              {isOpen && (
                <MonthPanel
                  month={month}
                  categories={categories}
                  onOpenTransactions={() => onOpenTransactions(month.monthKey)}
                />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
