import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateKey, formatUsd, MONTH_NAMES } from '@/lib/format'
import { makeHeatScale } from '@/lib/stats'
import type { DayStat } from '@/lib/types'

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

type CalendarHeatmapProps = {
  days: Map<string, DayStat>
  years: number[]
  year: number
  onYearChange: (year: number) => void
  selectedDay: string | null
  onSelectDay: (dateKey: string | null) => void
}

type HoverState = {
  x: number
  y: number
  dateKey: string
  spend: number
  refunds: number
  count: number
}

const pad = (n: number) => String(n).padStart(2, '0')

export const CalendarHeatmap = ({
  days,
  years,
  year,
  onYearChange,
  selectedDay,
  onSelectDay,
}: CalendarHeatmapProps) => {
  const [hover, setHover] = useState<HoverState | null>(null)

  // The scale is built across the whole history, so colours mean the same thing
  // in every year — switching years never repaints the same amount differently.
  const { level, thresholds } = useMemo(
    () => makeHeatScale([...days.values()].map((d) => d.spend)),
    [days],
  )

  const yearIndex = years.indexOf(year)

  // Newest first, and never a month that hasn't happened yet.
  const monthIndexes = useMemo(() => {
    const now = new Date()
    const lastMonth = year === now.getFullYear() ? now.getMonth() : 11
    return Array.from({ length: lastMonth + 1 }, (_, i) => lastMonth - i)
  }, [year])
  const monthTotals = useMemo(() => {
    const totals = new Array(12).fill(0) as number[]
    for (const day of days.values()) {
      if (Number(day.dateKey.slice(0, 4)) !== year) continue
      totals[Number(day.dateKey.slice(5, 7)) - 1] += day.spend
    }
    return totals
  }, [days, year])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Предыдущий год"
            disabled={yearIndex >= years.length - 1}
            onClick={() => onYearChange(years[yearIndex + 1])}
          >
            <ChevronLeft />
          </Button>
          <div className="w-20 text-center text-lg font-semibold tabular-nums">{year}</div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Следующий год"
            disabled={yearIndex <= 0}
            onClick={() => onYearChange(years[yearIndex - 1])}
          >
            <ChevronRight />
          </Button>
        </div>

        <Legend thresholds={thresholds} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {monthIndexes.map((monthIndex) => (
          <Card key={monthIndex} className="gap-0 py-4">
            <CardContent className="px-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium capitalize">{MONTH_NAMES[monthIndex]}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {monthTotals[monthIndex] > 0 ? formatUsd(monthTotals[monthIndex]) : '—'}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday}
                    className="text-muted-foreground pb-1 text-center text-[10px]"
                  >
                    {weekday}
                  </div>
                ))}
                <MonthCells
                  year={year}
                  monthIndex={monthIndex}
                  days={days}
                  level={level}
                  selectedDay={selectedDay}
                  onSelectDay={onSelectDay}
                  onHover={setHover}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hover && (
        <div
          className="bg-popover text-popover-foreground pointer-events-none fixed z-50 rounded-md border px-3 py-2 text-xs shadow-md"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-medium">{formatDateKey(hover.dateKey)}</div>
          <div className="tabular-nums">Потрачено: {formatUsd(hover.spend)}</div>
          {hover.refunds > 0 && (
            <div className="tabular-nums">Возвраты: {formatUsd(hover.refunds)}</div>
          )}
          <div className="text-muted-foreground">
            {hover.count} {pluralTxn(hover.count)}
          </div>
        </div>
      )}
    </div>
  )
}

type MonthCellsProps = {
  year: number
  monthIndex: number
  days: Map<string, DayStat>
  level: (value: number) => number
  selectedDay: string | null
  onSelectDay: (dateKey: string | null) => void
  onHover: (state: HoverState | null) => void
}

const MonthCells = ({
  year,
  monthIndex,
  days,
  level,
  selectedDay,
  onSelectDay,
  onHover,
}: MonthCellsProps) => {
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7 // week starts on Monday

  const cells = []
  for (let i = 0; i < offset; i++) {
    cells.push(<div key={`pad-${i}`} aria-hidden />)
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const dateKey = `${year}-${pad(monthIndex + 1)}-${pad(dayNumber)}`
    const stat = days.get(dateKey)
    const step = stat ? level(stat.spend) : 0
    const isSelected = selectedDay === dateKey

    cells.push(
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
        {dayNumber}
      </button>,
    )
  }

  return <>{cells}</>
}

const Legend = ({ thresholds }: { thresholds: number[] }) => {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <span>меньше</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className="size-4 rounded-[4px]"
            style={{ backgroundColor: `var(--heat-${step})` }}
            title={
              thresholds.length === 4
                ? step === 1
                  ? `до ${formatUsd(thresholds[0])}`
                  : step === 5
                    ? `свыше ${formatUsd(thresholds[3])}`
                    : `${formatUsd(thresholds[step - 2])} – ${formatUsd(thresholds[step - 1])}`
                : undefined
            }
          />
        ))}
      </div>
      <span>больше</span>
    </div>
  )
}

export const pluralTxn = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'операция'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'операции'
  return 'операций'
}
