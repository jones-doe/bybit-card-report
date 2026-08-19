import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatMonthKey, formatUsd } from '@/lib/format'
import { isPlainPurchase } from '@/lib/side'
import type { Txn } from '@/lib/types'

const PAGE_SIZE = 100

interface TransactionsTableProps {
  txns: Txn[]
  months: string[]
  monthFilter: string
  onMonthFilterChange: (monthKey: string) => void
}

export function TransactionsTable({
  txns,
  months,
  monthFilter,
  onMonthFilterChange,
}: TransactionsTableProps) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return txns.filter((t) => {
      if (monthFilter !== 'all' && t.monthKey !== monthFilter) return false
      if (!needle) return true
      return (
        t.merchant.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle) ||
        t.categoryDetail.toLowerCase().includes(needle) ||
        (t.mcc ?? '').includes(needle) ||
        t.country.toLowerCase().includes(needle) ||
        t.city.toLowerCase().includes(needle)
      )
    })
  }, [txns, query, monthFilter])

  const shown = filtered.slice(0, visible)

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle>Транзакции</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setVisible(PAGE_SIZE)
              }}
              placeholder="Мерчант, категория, город…"
              className="pl-9"
            />
          </div>

          <Select
            value={monthFilter}
            onValueChange={(value) => {
              onMonthFilterChange(value)
              setVisible(PAGE_SIZE)
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Все месяцы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все месяцы</SelectItem>
              {months.map((monthKey) => (
                <SelectItem key={monthKey} value={monthKey} className="capitalize">
                  {formatMonthKey(monthKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => downloadCsv(filtered)}>
            <Download />
            CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Дата</TableHead>
                <TableHead>Мерчант</TableHead>
                <TableHead className="w-52">Категория</TableHead>
                <TableHead className="w-28">Место</TableHead>
                <TableHead className="w-36 text-right">Сумма, USD</TableHead>
                <TableHead className="w-36 text-right">В валюте операции</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDateTime(t.ts)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.merchant}
                    {t.sideLabel && !isPlainPurchase(t.side) && (
                      <Badge variant="secondary" className="ml-2">
                        {t.sideLabel.toLowerCase()}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{t.category}</span>
                    {t.categoryDetail && t.categoryDetail !== t.category && (
                      <span className="text-muted-foreground/70 block text-xs">
                        {t.categoryDetail}
                        {t.mcc && ` · MCC ${t.mcc}`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {[t.city, t.country].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.direction === 'hold' ? (
                      <span className="text-muted-foreground">не списано</span>
                    ) : t.usd === null ? (
                      <span className="text-muted-foreground">нет USD</span>
                    ) : (
                      <span style={t.isRefund ? { color: 'var(--heat-refund)' } : undefined}>
                        {formatUsd(t.usd)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {t.sourceAmount !== null && t.sourceCurrency
                      ? `${t.sourceAmount.toFixed(2)} ${t.sourceCurrency}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                    Ничего не найдено.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {visible < filtered.length && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              Показать ещё ({filtered.length - visible})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function downloadCsv(txns: Txn[]) {
  const header = [
    'datetime',
    'date',
    'merchant',
    'category',
    'mcc',
    'mcc_description',
    'side',
    'side_label',
    'direction',
    'city',
    'country',
    'usd',
    'source_amount',
    'source_currency',
    'fees',
    'is_refund',
    'status',
  ]
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const rows = txns.map((t) =>
    [
      new Date(t.ts).toISOString(),
      t.dateKey,
      t.merchant,
      t.category,
      t.mcc ?? '',
      t.categoryDetail,
      t.side,
      t.sideLabel,
      t.direction,
      t.city,
      t.country,
      t.usd ?? '',
      t.sourceAmount ?? '',
      t.sourceCurrency,
      t.fees,
      t.isRefund ? '1' : '0',
      t.status,
    ]
      .map(escape)
      .join(','),
  )

  const blob = new Blob([[header.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bybit-card-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
