import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime, formatUsd } from '@/lib/format'
import type { Totals } from '@/lib/stats'

export function StatTiles({ totals }: { totals: Totals }) {
  const tiles: Array<{ label: string; value: string; hint?: string }> = [
    {
      // Net, so this headline and the per-month figures add up.
      label: 'Всего потрачено',
      value: formatUsd(totals.net),
      hint:
        totals.refunds > 0
          ? `покупки ${formatUsd(totals.spend)} · возвраты −${formatUsd(totals.refunds)}`
          : undefined,
    },
    {
      label: 'Транзакций',
      value: String(totals.count),
      hint:
        totals.firstTs && totals.lastTs
          ? `${formatDateTime(totals.firstTs)} — ${formatDateTime(totals.lastTs)}`
          : undefined,
    },
    { label: 'Средний чек', value: formatUsd(totals.avgCheck) },
    {
      label: 'В среднем за активный день',
      value: formatUsd(totals.avgPerActiveDay),
      hint: `${totals.activeDays} дн. с тратами`,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="py-4">
          <CardContent className="px-4">
            <div className="text-muted-foreground text-xs">{tile.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</div>
            {tile.hint && <div className="text-muted-foreground mt-1 text-xs">{tile.hint}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
