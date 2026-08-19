import type { CardAssetRecord } from './CardAssetRecord'

/** `result` payload of query-asset-records, as sent. */
export type CardAssetRecordsResult = {
  pageSize: number | string
  pageNo: number | string
  totalCount: number | string
  data: CardAssetRecord[]
}
