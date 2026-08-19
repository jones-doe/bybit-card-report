import { useState } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateKey, formatUsd, pluralTxn } from '@/lib/format'
import type { CategoryStat, MonthStat } from '@/lib/types'
import { MerchantList } from './MerchantList'
import { foldTail, percent } from './utils'

/** How many categories the per-month table names before folding the tail. */
/** How many categories the per-month table names before folding the tail. */
export const TABLE_LIMIT = 12

type MonthPanelProps = {
  month: MonthStat
  categories: CategoryStat[]
  onOpenTransactions: () => void
}

export const MonthPanel = ({ month, categories, onOpenTransactions }: MonthPanelProps) => {
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

const Metric = ({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'refund'
}) => {
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
