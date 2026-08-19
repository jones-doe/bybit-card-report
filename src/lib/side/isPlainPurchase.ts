import { normalizeCode } from './normalizeCode'

/** True for the ordinary purchase codes, which need no badge in the UI. */
export const isPlainPurchase = (side: unknown): boolean => {
  const code = normalizeCode(side)
  return code === '3' || code === '7'
}
