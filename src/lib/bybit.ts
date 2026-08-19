import type { BybitEnvelope, CardAssetRecord, CardAssetRecordsResult } from './types'
import type { Credentials } from './credentials'

/**
 * Bybit serves CORS headers on this endpoint and allows the X-BAPI-* request
 * headers, so the browser calls it directly — dev and the static build run the
 * exact same path. Set VITE_BYBIT_BASE=/bybit to route through the dev-server
 * proxy instead, should that ever stop being true.
 *
 * One consequence of going cross-origin: only `token` and `X-Signature` are in
 * Access-Control-Expose-Headers, so X-Bapi-Limit-Reset-Timestamp is invisible
 * to the page and the rate-limit backoff falls back to pure exponential.
 */
const API_BASE = import.meta.env.VITE_BYBIT_BASE ?? 'https://api.bybit.com'
const ENDPOINT = `${API_BASE}/v5/card/transaction/query-asset-records`
const RECV_WINDOW = '20000'
/** The endpoint caps a page at 100 records. */
export const PAGE_LIMIT = 100
const MAX_PAGES = 500

/** retCode Bybit uses for "Too many visits. Exceeded the API Rate Limit." */
const RATE_LIMIT_RETCODE = 10006

/** Pacing between pages. Grows after every rate-limit hit and never shrinks. */
const BASE_PAGE_DELAY_MS = 350
const MAX_PAGE_DELAY_MS = 5_000
const PAGE_DELAY_GROWTH = 1.8

/** Backoff for a page that was actually rejected. */
const MAX_RETRIES = 7
const BASE_BACKOFF_MS = 1_500
const MAX_BACKOFF_MS = 60_000

export class BybitApiError extends Error {
  readonly retCode: number
  readonly retMsg: string
  /** From X-Bapi-Limit-Reset-Timestamp, when the response carried it. */
  readonly resetAt: number | null

  constructor(message: string, retCode: number, retMsg: string, resetAt: number | null = null) {
    super(message)
    this.name = 'BybitApiError'
    this.retCode = retCode
    this.retMsg = retMsg
    this.resetAt = resetAt
  }
}

function isRateLimited(error: unknown): error is BybitApiError {
  if (!(error instanceof BybitApiError)) return false
  // 10006 is the documented retCode; a bare HTTP 403 is the IP-level limit.
  return error.retCode === RATE_LIMIT_RETCODE || error.retCode === 403
}

const encoder = new TextEncoder()

/** Bybit v5 signature: HMAC-SHA256(timestamp + apiKey + recvWindow + rawBody). */
async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function resetTimestampOf(response: Response): number | null {
  const raw = response.headers.get('x-bapi-limit-reset-timestamp')
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

async function postPrivate<T>(
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

  const response = await fetch(ENDPOINT, {
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

export interface FetchProgress {
  page: number
  fetched: number
  total: number | null
  /** Set while backing off after a rate-limit rejection. */
  retry?: { attempt: number; secondsLeft: number }
}

export interface FetchOptions {
  credentials: Credentials
  onProgress?: (progress: FetchProgress) => void
  signal?: AbortSignal
  /** Extra request fields, merged over the defaults. */
  params?: Record<string, unknown>
}

/**
 * Walks every page sequentially and returns the full history at once — callers
 * aggregate only after the whole set has landed.
 *
 * The endpoint rate-limits hard, so pacing is adaptive: every 10006 both backs
 * the current page off and permanently slows the gap between later pages.
 */
export async function fetchAllAssetRecords({
  credentials,
  onProgress,
  signal,
  params,
}: FetchOptions): Promise<CardAssetRecord[]> {
  const all: CardAssetRecord[] = []
  let total: number | null = null
  let pageDelay = BASE_PAGE_DELAY_MS

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    let result: CardAssetRecordsResult | null = null

    for (let attempt = 0; ; attempt++) {
      try {
        result = await postPrivate<CardAssetRecordsResult>(
          credentials,
          {
            page,
            limit: PAGE_LIMIT,
            status_code: '1',
            // Undocumented value: the docs list SIDE_QUERY_AUTH /
            // SIDE_QUERY_FINANCIAL / SIDE_QUERY_REFUND, but _ALL is what the web
            // app sends and the only one returning purchases and refunds together.
            type: 'SIDE_QUERY_FINANCIAL_ALL',
            ...params,
          },
          signal,
        )
        break
      } catch (error) {
        if (!isRateLimited(error) || attempt >= MAX_RETRIES) throw error

        // Slow every later page down too — one 10006 means the whole walk is
        // going faster than this key is allowed to.
        pageDelay = Math.min(Math.round(pageDelay * PAGE_DELAY_GROWTH), MAX_PAGE_DELAY_MS)

        const backoff = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS)
        const untilReset = error.resetAt ? error.resetAt - Date.now() + 500 : 0
        const waitMs = Math.max(backoff, untilReset)

        // Emit a ticking countdown so the UI can explain the pause.
        const startedAt = Date.now()
        for (;;) {
          const left = waitMs - (Date.now() - startedAt)
          if (left <= 0) break
          onProgress?.({
            page,
            fetched: all.length,
            total,
            retry: { attempt: attempt + 1, secondsLeft: Math.ceil(left / 1000) },
          })
          await sleep(Math.min(1000, left), signal)
        }
      }
    }

    const batch = Array.isArray(result?.data) ? result.data : []
    all.push(...batch)
    // Sent as a string on some responses, so coerce rather than typeof-check.
    const reported = Number(result?.totalCount)
    if (Number.isFinite(reported) && reported >= 0) total = reported
    onProgress?.({ page, fetched: all.length, total })

    const reachedTotal = total !== null && all.length >= total
    if (batch.length < PAGE_LIMIT || reachedTotal) break

    await sleep(pageDelay, signal)
  }

  return all
}
