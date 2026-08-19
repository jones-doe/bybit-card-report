/** Wrapper every v5 endpoint answers with. */
export type BybitEnvelope<T> = {
  retCode: number
  retMsg: string
  result: T
  retExtInfo?: unknown
  time?: number
}
