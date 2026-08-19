import { MCC_DESCRIPTIONS } from './mccData'

/** Official description of the code, e.g. "5814" → "Fast Food Restaurants". */
export function mccDescription(code: string): string | null {
  return MCC_DESCRIPTIONS[code] ?? null
}
