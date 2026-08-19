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
export async function postPrivate<T>(
  path: string,
  credentials: Credentials,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const rawBody = JSON.stringify(body)
  const timestamp = Date.now().toString()
  const signature = await sign(
    credentials.apiSecret,
    timestamp + credentials.apiKey + RECV_WINDOW + rawBody,
  )

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': credentials.apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW,
      'X-BAPI-SIGN': signature,
    },
    body: rawBody,
  })

  const resetAt = resetTimestampOf(response)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new BybitApiError(
      `HTTP ${response.status} ${response.statusText}${text ? ` — ${text.slice(0, 300)}` : ''}`,
      response.status,
      response.statusText,
      resetAt,
    )
  }

  const envelope = (await response.json()) as BybitEnvelope<T>
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
