import { postPrivate } from './internal/postPrivate'
import type { CardAssetRecordsResult } from './types/CardAssetRecordsResult'
import type { Credentials } from './types/Credentials'
import type { QueryAssetRecordsParams } from './types/QueryAssetRecordsParams'

const PATH = '/v5/card/transaction/query-asset-records'

/**
 * One page of Bybit Card transactions. Takes the request body as the endpoint
 * defines it and resolves with the `result` payload as the server sends it —
 * no defaults applied, no fields reshaped. Rejects with BybitApiError.
 */
export function queryAssetRecords(
  credentials: Credentials,
  params: QueryAssetRecordsParams,
  signal?: AbortSignal,
): Promise<CardAssetRecordsResult> {
  return postPrivate<CardAssetRecordsResult>(PATH, credentials, { ...params }, signal)
}
