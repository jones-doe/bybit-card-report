import { EXPLICIT_GROUPS, GROUP_RANGES } from './mccData'

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
