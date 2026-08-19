import { normalizeCode } from './normalizeCode'
import { STATUS_LABELS } from './statusLabels'

export function statusLabel(value: unknown): string | null {
  return STATUS_LABELS[normalizeCode(value)] ?? null
}
