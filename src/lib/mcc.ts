import { GROUP_RANGES, EXPLICIT_GROUPS, MCC_DESCRIPTIONS } from './mcc-data'

/**
 * Bybit sends the merchant category as a bare MCC (ISO 18245) — `mccCode`, and
 * sometimes `merchCategoryDesc` too. Anything that is 3–4 digits is treated as
 * a code; a real description is left alone.
 */
export function normalizeMcc(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!/^\d{3,4}$/.test(raw)) return null
  const code = raw.padStart(4, '0')
  return code === '0000' ? null : code
}

/** Official description of the code, e.g. "5814" → "Fast Food Restaurants". */
export function mccDescription(code: string): string | null {
  return MCC_DESCRIPTIONS[code] ?? null
}

/** The spending group the code rolls up to, e.g. "5814" → "Кафе и рестораны". */
export function mccGroup(code: string): string | null {
  const explicit = EXPLICIT_GROUPS[code]
  if (explicit) return explicit

  const numeric = Number(code)
  for (const [low, high, group] of GROUP_RANGES) {
    if (numeric >= low && numeric <= high) return group
  }
  return null
}
