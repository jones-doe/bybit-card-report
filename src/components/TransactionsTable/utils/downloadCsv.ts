import type { Txn } from '@/lib/types'

export const downloadCsv = (txns: Txn[]) => {
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
    'status_label',
    'trade_status_label',
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
      t.statusLabel,
      t.tradeStatusLabel,
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
