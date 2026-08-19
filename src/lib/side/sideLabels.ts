/**
 * Documented enums of a card asset record. They all arrive as numeric codes:
 * https://bybit-exchange.github.io/docs/v5/bybit-card/asset-records
 */

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
