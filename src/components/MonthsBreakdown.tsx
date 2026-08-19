import { useMemo, useState } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateKey, formatMonthKey, formatUsd } from '@/lib/format'
import {
  buildMonthCategories,
  OTHER_CATEGORY,
  type CategoryStat,
  type MerchantStat,
} from '@/lib/stats'
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

  const spend = tail.reduce((sum, c) => sum + c.spend, 0)

  // Merchants of the folded categories are merged, so opening "Прочее" still
  // answers where that money went.
  const merged = new Map<string, MerchantStat>()
  for (const category of tail) {
    for (const m of category.merchants) {
      const existing = merged.get(m.name)
      if (existing) {
        existing.spend += m.spend
        existing.refunds += m.refunds
        existing.count += m.count
      } else {
        merged.set(m.name, { ...m })
      }
    }
  }

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

interface MonthPanelProps {
  month: MonthStat
  categories: CategoryStat[]
  onOpenTransactions: () => void
}

function MonthPanel({ month, categories, onOpenTransactions }: MonthPanelProps) {
  const rows = foldTail(categories, (_, index) => index < TABLE_LIMIT)
  const max = Math.max(...rows.map((c) => c.spend), 1)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  const refundCount = month.days.reduce(
    (total, day) => total + day.txns.filter((t) => t.isRefund).length,
    0,
  )

  return (
    <div className="bg-muted/40 mt-1 mb-2 space-y-4 rounded-lg px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Потрачено" value={formatUsd(month.spend)} />
        <Metric
          label="Возвраты"
          value={month.refunds > 0 ? `−${formatUsd(month.refunds)}` : formatUsd(0)}
          tone={month.refunds > 0 ? 'refund' : undefined}
        />
        <Metric label="Итого" value={formatUsd(month.net)} hint="потрачено минус возвраты" />
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
            <div key={c.name}>
            <button
              type="button"
              onClick={() => toggle(c.name)}
              aria-expanded={open.has(c.name)}
              className="hover:bg-accent/50 focus-visible:ring-ring grid w-full grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 rounded-md py-1 text-left transition focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ChevronDown
                  className={`text-muted-foreground size-3 shrink-0 transition-transform ${open.has(c.name) ? '' : '-rotate-90'}`}
                />
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
            </button>

            {open.has(c.name) && <MerchantList category={c} />}
            </div>
          ))}

          {month.refunds > 0 && (
            <div className="mt-1 grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 border-t pt-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="refund-hatch size-2.5 shrink-0 rounded-[3px]" />
                <span className="truncate text-sm">Возвраты</span>
              </span>

              <span className="flex h-4 items-center">
                <span
                  className="refund-hatch h-2 rounded-r-[4px]"
                  style={{ width: `${Math.max((month.refunds / max) * 100, 1)}%` }}
                />
              </span>

              <span className="flex items-baseline gap-3 text-right">
                <span className="text-muted-foreground w-10 text-xs tabular-nums">
                  −{percent(month.spend > 0 ? month.refunds / month.spend : 0)}
                </span>
                <span
                  className="w-24 text-sm font-medium tabular-nums"
                  style={{ color: 'var(--heat-refund)' }}
                >
                  −{formatUsd(month.refunds)}
                </span>
                <span className="text-muted-foreground w-20 text-xs tabular-nums">
                  {refundCount} {pluralTxn(refundCount)}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={onOpenTransactions}>
        <ListFilter />
        Транзакции за месяц
      </Button>
    </div>
  )
}

/** How many merchants a category names before folding the rest. */
const MERCHANT_LIMIT = 8

function MerchantList({ category }: { category: CategoryStat }) {
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

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'refund'
}) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div
        className="text-xl font-semibold tabular-nums"
        style={tone === 'refund' ? { color: 'var(--heat-refund)' } : undefined}
      >
        {value}
      </div>
      {hint && <div className="text-muted-foreground text-xs">{hint}</div>}
    </div>
  )
}
