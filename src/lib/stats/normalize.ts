import { sideLabel, statusLabel, tradeStatusLabel } from '@/lib/side'
import type { Txn } from '@/lib/types'
import type { CardAssetRecord } from '@/requests/queryAssetRecords'
import { dateKeyOf } from './dateKeyOf'
import { monthKeyOf } from './monthKeyOf'
import { categorize } from './internal/categorize'
import { directionOf } from './internal/directionOf'
import { toMillis } from './internal/toMillis'
import { toNumber } from './internal/toNumber'
import { usdAmountOf } from './internal/usdAmountOf'

export const normalize = (records: CardAssetRecord[]): Txn[] =>
  records
    .map((r, index) => ({ r, index, ts: toMillis(r.txnCreate) }))
    .filter((entry): entry is { r: CardAssetRecord; index: number; ts: number } => entry.ts !== null)
    .map(({ r, index, ts }): Txn => {
      const { category, categoryDetail, mcc } = categorize(r)
      const rawUsd = usdAmountOf(r)
      const direction = directionOf(r, rawUsd)
      const isRefund = direction === 'refund'
      const magnitude = rawUsd === null ? null : Math.abs(rawUsd)
      const dateKey = dateKeyOf(ts)

      return {
        id: String(r.txnId || r.orderNo || `${ts}-${index}`),
        ts,
        dateKey,
        monthKey: monthKeyOf(dateKey),
        usd: magnitude === null ? null : isRefund ? -magnitude : magnitude,
        sourceCurrency: String(r.transactionCurrency || r.basicCurrency || ''),
        sourceAmount: toNumber(r.transactionAmount) ?? toNumber(r.basicAmount),
        merchant: String(r.merchName || '—').trim(),
        category,
        categoryDetail,
        mcc,
        country: String(r.merchCountry || '').trim(),
        city: String(r.merchCity || '').trim(),
        status: String(r.status ?? '').trim(),
        statusLabel: statusLabel(r.status) ?? '',
        tradeStatusLabel: tradeStatusLabel(r.tradeStatus) ?? '',
        side: String(r.side || '').trim(),
        sideLabel: sideLabel(r.side) ?? '',
        direction,
        fees: toNumber(r.totalFees) ?? 0,
        isRefund,
        raw: r,
      }
    })
    .sort((a, b) => b.ts - a.ts)
