import { EXPLICIT_GROUPS, GROUP_RANGES } from './mccData'

/** The spending group the code rolls up to, e.g. "5814" → "Кафе и рестораны". */
export const mccGroup = (code: string): string | null => {
  const explicit = EXPLICIT_GROUPS[code]
  if (explicit) return explicit

  const numeric = Number(code)
  const range = GROUP_RANGES.find(([low, high]) => numeric >= low && numeric <= high)
  return range?.[2] ?? null
}
