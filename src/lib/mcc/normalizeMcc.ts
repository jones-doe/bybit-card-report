/**
 * Bybit sends the merchant category as a bare MCC (ISO 18245) — `mccCode`, and
 * sometimes `merchCategoryDesc` too. Anything that is 3–4 digits is treated as
 * a code; a real description is left alone.
 */
export const normalizeMcc = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  const raw = String(value).trim()
  if (!/^\d{3,4}$/.test(raw)) return null
  const code = raw.padStart(4, '0')
  return code === '0000' ? null : code
}
