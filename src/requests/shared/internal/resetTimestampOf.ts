/** Parses X-Bapi-Limit-Reset-Timestamp, when the response exposed it. */
export const resetTimestampOf = (raw: string | null | undefined): number | null => {
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
