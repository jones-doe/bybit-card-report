import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateKey, formatTime, formatUsd } from '@/lib/format'
import { isPlainPurchase } from '@/lib/side'
import type { DayStat } from '@/lib/types'
import { pluralTxn } from './CalendarHeatmap'

type DayDetailsProps = {
  day: DayStat
  onClose: () => void
}

export const DayDetails = ({ day, onClose }: DayDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatDateKey(day.dateKey)}</CardTitle>
        <p className="text-muted-foreground text-sm tabular-nums">
          {formatUsd(day.spend)} · {day.count} {pluralTxn(day.count)}
          {day.refunds > 0 && ` · возвраты ${formatUsd(day.refunds)}`}
        </p>
        <CardAction>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
            <X />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
        {[...day.txns]
          .sort((a, b) => a.ts - b.ts)
          .map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {t.merchant}
                  {t.sideLabel && !isPlainPurchase(t.side) && (
                    <Badge variant="secondary" className="ml-2">
                      {t.sideLabel.toLowerCase()}
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {formatTime(t.ts)}
                  {(t.categoryDetail || t.category) && ` · ${t.categoryDetail || t.category}`}
                  {[t.city, t.country].filter(Boolean).length > 0 &&
                    ` · ${[t.city, t.country].filter(Boolean).join(', ')}`}
                </div>
              </div>
              <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                {t.direction === 'hold' ? (
                  <span className="text-muted-foreground font-normal">не списано</span>
                ) : t.usd === null ? (
                  <span className="text-muted-foreground font-normal">нет USD</span>
                ) : (
                  <span style={t.isRefund ? { color: 'var(--heat-refund)' } : undefined}>
                    {formatUsd(t.usd)}
                  </span>
                )}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
