import { normalizeCode } from './normalizeCode'
import { SIDE_LABELS } from './sideLabels'

/** Human label for a documented code, or null when the code is unknown. */
export const sideLabel = (side: unknown): string | null => {
  return SIDE_LABELS[normalizeCode(side)] ?? null
}
