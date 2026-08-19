/** Reads X-Bapi-Limit-Reset-Timestamp, when the response exposes it. */
export function resetTimestampOf(response: Response): number | null {
  const raw = response.headers.get('x-bapi-limit-reset-timestamp')
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
