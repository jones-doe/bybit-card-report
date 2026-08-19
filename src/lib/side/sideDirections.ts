import type { TxnDirection } from './TxnDirection'

export const SIDE_DIRECTIONS: Record<string, TxnDirection> = {
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
