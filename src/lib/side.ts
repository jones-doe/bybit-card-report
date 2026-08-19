/**
 * The `side` field of a card asset record is a numeric operation code, not a
 * word. Values are documented at
 * https://bybit-exchange.github.io/docs/v5/bybit-card/asset-records
 */

/**
 * What the operation does to the balance:
 * - `spend`  — money leaves the card
 * - `refund` — money comes back
 * - `hold`   — an authorisation or a request; no settled movement, so it must
 *   stay out of the sums or it would double-count against its settlement.
 */
export type TxnDirection = 'spend' | 'refund' | 'hold'

export const SIDE_LABELS: Record<string, string> = {
  '1': 'Авторизация',
  '2': 'Отмена авторизации',
  '3': 'Покупка',
  '4': 'Возврат (без списания)',
  '5': 'Возврат',
  '6': 'Чарджбэк',
  '7': 'Покупка (прямая)',
  '8': 'Отмена возврата',
  '9': 'Отмена чарджбэка',
  '10': 'Заявка на возврат',
  '11': 'Заявка на отмену возврата',
  '12': 'Комиссия за чарджбэк',
  '13': 'Снятие в банкомате',
}

const SIDE_DIRECTIONS: Record<string, TxnDirection> = {
  '1': 'hold', // authorisation — settles later as side 3
  '2': 'hold', // the hold is released, nothing settled
  '3': 'spend',
  '4': 'refund',
  '5': 'refund',
  '6': 'refund', // chargeback returns the money
  '7': 'spend',
  '8': 'spend', // a refund taken back
  '9': 'spend', // a chargeback taken back
  '10': 'hold', // request, not a settlement
  '11': 'hold',
  '12': 'spend', // fee charged to the cardholder
  '13': 'spend', // cash withdrawn
}

const normalize = (side: unknown) => String(side ?? '').trim()

/** Direction for a documented code, or null when the code is unknown. */
export function sideDirection(side: unknown): TxnDirection | null {
  return SIDE_DIRECTIONS[normalize(side)] ?? null
}

/** Human label for a documented code, or null when the code is unknown. */
export function sideLabel(side: unknown): string | null {
  return SIDE_LABELS[normalize(side)] ?? null
}

/** True for the ordinary purchase codes, which need no badge in the UI. */
export function isPlainPurchase(side: unknown): boolean {
  const code = normalize(side)
  return code === '3' || code === '7'
}
