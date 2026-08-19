/** A non-zero retCode, or an HTTP failure, from a Bybit endpoint. */
export class BybitApiError extends Error {
  readonly retCode: number
  readonly retMsg: string
  /**
   * From X-Bapi-Limit-Reset-Timestamp. Null cross-origin: Bybit exposes only
   * `token` and `X-Signature`, so the browser cannot read that header.
   */
  readonly resetAt: number | null

  constructor(message: string, retCode: number, retMsg: string, resetAt: number | null = null) {
    super(message)
    this.name = 'BybitApiError'
    this.retCode = retCode
    this.retMsg = retMsg
    this.resetAt = resetAt
  }
}
