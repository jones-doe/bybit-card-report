import { normalizeCode } from './normalizeCode'
import { TRADE_STATUS_LABELS } from './tradeStatusLabels'

export function tradeStatusLabel(value: unknown): string | null {
  return TRADE_STATUS_LABELS[normalizeCode(value)] ?? null
}
