import { useMemo, useState } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateKey, formatMonthKey, formatUsd } from '@/lib/format'
import { buildMonthCategories, OTHER_CATEGORY, type CategoryStat } from '@/lib/stats'
import type { MonthStat } from '@/lib/types'
import { pluralTxn } from './CalendarHeatmap'

interface MonthsBreakdownProps {
  months: MonthStat[]
  categoryOrder: Map<string, number>
  onOpenTransactions: (monthKey: string) => void
}

const percent = (share: number) => `${share >= 0.01 ? Math.round(share * 100) : '<1'}%`

/** How many categories the per-month table names before folding the tail. */
const TABLE_LIMIT = 12

function foldTail(
  categories: CategoryStat[],
  keep: (c: CategoryStat, index: number) => boolean,
): CategoryStat[] {
  const kept = categories.filter((c, i) => keep(c, i) && c.spend > 0)
  const tail = categories.filter((c, i) => !keep(c, i))
  if (tail.length === 0) return kept

  const folded: CategoryStat = {
    name: tail.length > 1 ? `${OTHER_CATEGORY} (${tail.length})` : tail[0].name,
    slot: 0,
    spend: tail.reduce((sum, c) => sum + c.spend, 0),
    refunds: tail.reduce((sum, c) => sum + c.refunds, 0),
    count: tail.reduce((sum, c) => sum + c.count, 0),
    share: tail.reduce((sum, c) => sum + c.share, 0),
  }
  return folded.spend > 0 ? [...kept, folded].sort((a, b) => b.spend - a.spend) : kept
}

export function MonthsBreakdown({
  months,
  categoryOrder,
  onOpenTransactions,
}: MonthsBreakdownProps) {
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

  const max = Math.max(...months.map((m) => m.spend), 1)
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
                    style={{ width: `${Math.max((month.spend / max) * 100, 1.5)}%` }}
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
                    {formatUsd(month.spend)}
                  </span>
                  <span className="text-muted-foreground block text-xs tabular-nums">
                    {month.count} {pluralTxn(month.count)} · ср. {formatUsd(month.avgCheck)}
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

interface MonthPanelProps {
  month: MonthStat
  categories: CategoryStat[]
  onOpenTransactions: () => void
}

function MonthPanel({ month, categories, onOpenTransactions }: MonthPanelProps) {
  const rows = foldTail(categories, (_, index) => index < TABLE_LIMIT)
  const max = Math.max(...rows.map((c) => c.spend), 1)

  return (
    <div className="bg-muted/40 mt-1 mb-2 space-y-4 rounded-lg px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Потрачено" value={formatUsd(month.spend)} />
        <Metric label="Возвраты" value={formatUsd(month.refunds)} />
        <Metric label="Средний чек" value={formatUsd(month.avgCheck)} />
        <Metric
          label="Дней с тратами"
          value={String(month.activeDays)}
          hint={
            month.maxDay
              ? `пик — ${formatDateKey(month.maxDay.dateKey)}, ${formatUsd(month.maxDay.spend)}`
              : undefined
          }
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Нет операций с суммой в USD.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((c) => (
            <div
              key={c.name}
              className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 py-1"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: `var(--cat-${c.slot})` }}
                />
                <span className="truncate text-sm">{c.name}</span>
              </span>

              <span className="flex h-4 items-center">
                <span
                  className="h-2 rounded-r-[4px]"
                  style={{
                    width: `${Math.max((c.spend / max) * 100, 1)}%`,
                    backgroundColor: `var(--cat-${c.slot})`,
                  }}
                />
              </span>

              <span className="flex items-baseline gap-3 text-right">
                <span className="text-muted-foreground w-10 text-xs tabular-nums">
                  {percent(c.share)}
                </span>
                <span className="w-24 text-sm font-medium tabular-nums">{formatUsd(c.spend)}</span>
                <span className="text-muted-foreground w-20 text-xs tabular-nums">
                  {c.count} {pluralTxn(c.count)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={onOpenTransactions}>
        <ListFilter />
        Транзакции за месяц
      </Button>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-muted-foreground text-xs">{hint}</div>}
    </div>
  )
}
