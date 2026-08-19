import { toNumber } from './toNumber'

export function toMillis(value: unknown): number | null {
  const n = toNumber(value)
  if (n === null || n <= 0) return null
  // txnCreate arrives in seconds on some records and milliseconds on others.
  return n < 1e12 ? Math.round(n * 1000) : Math.round(n)
}
