/**
 * What the operation does to the balance:
 * - `spend`  — money leaves the card
 * - `refund` — money comes back
 * - `hold`   — an authorisation or a request; no settled movement, so it must
 *   stay out of the sums or it would double-count against its settlement.
 */

/**
 * What the operation does to the balance:
 * - `spend`  — money leaves the card
 * - `refund` — money comes back
 * - `hold`   — an authorisation or a request; no settled movement, so it must
 *   stay out of the sums or it would double-count against its settlement.
 */
export type TxnDirection = 'spend' | 'refund' | 'hold'
