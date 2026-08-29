import { eachDayOfInterval, endOfMonth, format, getISODay, startOfMonth } from 'date-fns'
import { formatDateKey, formatUsd, pluralTxn } from '@/lib/format'
import type { DayStat } from '@/lib/types'
import type { HoverState } from './HoverState'

type MonthCellsProps = {
  year: number
  monthIndex: number
  days: Map<string, DayStat>
  level: (value: number) => number
  selectedDay: string | null
  onSelectDay: (dateKey: string | null) => void
  onHover: (state: HoverState | null) => void
}

export const MonthCells = ({
  year,
  monthIndex,
  days,
  level,
  selectedDay,
  onSelectDay,
  onHover,
}: MonthCellsProps) => {
  const monthStart = startOfMonth(new Date(year, monthIndex, 1))
  const monthDays = eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) })
  const offset = getISODay(monthStart) - 1 // week starts on Monday

  const paddingCells = Array.from({ length: offset }, (_, i) => (
    <div key={`pad-${i}`} aria-hidden />
  ))

  const dayCells = monthDays.map((day) => {
    const dateKey = format(day, 'yyyy-MM-dd')
    const stat = days.get(dateKey)
    const step = stat ? level(stat.spend) : 0
    const isSelected = selectedDay === dateKey

    return (
      <button
        key={dateKey}
        type="button"
        disabled={!stat}
        onClick={() => onSelectDay(isSelected ? null : dateKey)}
        onMouseEnter={(e) =>
          stat &&
          onHover({
            x: e.clientX,
            y: e.clientY,
            dateKey,
            spend: stat.spend,
            refunds: stat.refunds,
            count: stat.count,
          })
        }
        onMouseMove={(e) =>
          stat &&
          onHover({
            x: e.clientX,
            y: e.clientY,
            dateKey,
            spend: stat.spend,
            refunds: stat.refunds,
            count: stat.count,
          })
        }
        onMouseLeave={() => onHover(null)}
        title={
          stat
            ? `${formatDateKey(dateKey)} — ${formatUsd(stat.spend)}, ${stat.count} ${pluralTxn(stat.count)}`
            : formatDateKey(dateKey)
        }
        aria-label={
          stat ? `${formatDateKey(dateKey)}: ${formatUsd(stat.spend)}` : formatDateKey(dateKey)
        }
        className={[
          'flex aspect-square items-center justify-center rounded-[4px] text-[10px] tabular-nums transition',
          stat ? 'cursor-pointer hover:ring-foreground/40 hover:ring-2' : 'cursor-default',
          isSelected ? 'ring-foreground ring-2' : '',
        ].join(' ')}
        style={{
          backgroundColor: `var(--heat-${step || 'empty'})`,
          color: step >= 4 ? 'var(--heat-ink-hi)' : 'var(--heat-ink-lo)',
          opacity: stat ? 1 : 0.55,
        }}
      >
        {day.getDate()}
      </button>
    )
  })

  return (
    <>
      {paddingCells}
      {dayCells}
    </>
  )
}
