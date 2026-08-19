import { normalizeCode } from './normalizeCode'
import { SIDE_DIRECTIONS } from './sideDirections'
import type { TxnDirection } from './TxnDirection'

/** Direction for a documented code, or null when the code is unknown. */
export function sideDirection(side: unknown): TxnDirection | null {
  return SIDE_DIRECTIONS[normalizeCode(side)] ?? null
}
