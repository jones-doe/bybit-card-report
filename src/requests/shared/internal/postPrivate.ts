import axios from 'axios'
import { API_BASE } from '../constants/apiBase'
import { RECV_WINDOW } from '../constants/recvWindow'
import { BybitApiError } from '../errors/BybitApiError'
import type { BybitEnvelope } from '../types/BybitEnvelope'
import type { Credentials } from '../types/Credentials'
import { resetTimestampOf } from './resetTimestampOf'
import { sign } from './sign'

/**
 * Signs and sends one authenticated POST, then unwraps the envelope. Every
 * failure — HTTP or a non-zero retCode — surfaces as BybitApiError.
 */
export const postPrivate = async <T>(
  path: string,
  credentials: Credentials,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> => {
  const rawBody = JSON.stringify(body)
  const timestamp = Date.now().toString()
  const signature = await sign(
    credentials.apiSecret,
    timestamp + credentials.apiKey + RECV_WINDOW + rawBody,
  )

  const response = await axios.post<BybitEnvelope<T>>(`${API_BASE}${path}`, rawBody, {
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': credentials.apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW,
      'X-BAPI-SIGN': signature,
    },
    // Bybit's retCode envelope is the real error signal — resolve on every
    // HTTP status so it reaches the same handling below, instead of axios
    // throwing before we get a chance to read the body.
    validateStatus: () => true,
  })

  const resetAt = resetTimestampOf(response.headers['x-bapi-limit-reset-timestamp'])

  if (response.status < 200 || response.status >= 300) {
    const text =
      typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    throw new BybitApiError(
      `HTTP ${response.status} ${response.statusText}${text ? ` — ${text.slice(0, 300)}` : ''}`,
      response.status,
      response.statusText,
      resetAt,
    )
  }

  const envelope = response.data
  if (envelope.retCode !== 0) {
    throw new BybitApiError(
      `Bybit вернул ошибку ${envelope.retCode}: ${envelope.retMsg}`,
      envelope.retCode,
      envelope.retMsg,
      resetAt,
    )
  }
  return envelope.result
}
