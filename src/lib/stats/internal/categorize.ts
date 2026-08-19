import { mccDescription, mccGroup, normalizeMcc } from '../mcc'
import type { CardAssetRecord } from '@/requests/queryAssetRecords'
import { NO_CATEGORY } from '../constants'

/**
 * Turns whatever the record carries — an MCC, a text description, or nothing —
 * into a group for the charts plus the precise description for the table.
 */
export const categorize = (r: CardAssetRecord): {
  category: string
  categoryDetail: string
  mcc: string | null
} => {
  const rawDesc = String(r.merchCategoryDesc ?? '').trim()
  // A numeric merchCategoryDesc is a code, not a description.
  const descIsCode = normalizeMcc(rawDesc) !== null
  const description = descIsCode ? '' : rawDesc
  const mcc = normalizeMcc(r.mccCode) ?? normalizeMcc(rawDesc)

  const group = mcc ? mccGroup(mcc) : null
  const detail = description || (mcc ? (mccDescription(mcc) ?? '') : '')

  return {
    category: group || description || NO_CATEGORY,
    categoryDetail: detail,
    mcc,
  }
}
