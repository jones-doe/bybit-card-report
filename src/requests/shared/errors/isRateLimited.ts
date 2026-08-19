import { BybitApiError } from './BybitApiError'

/** retCode Bybit uses for "Too many visits. Exceeded the API Rate Limit." */
const RATE_LIMIT_RETCODE = 10006

/** True when the endpoint refused the call for rate reasons and a retry may pass. */
export function isRateLimited(error: unknown): error is BybitApiError {
  if (!(error instanceof BybitApiError)) return false
  // 10006 is the documented retCode; a bare HTTP 403 is the IP-level limit.
  return error.retCode === RATE_LIMIT_RETCODE || error.retCode === 403
}
