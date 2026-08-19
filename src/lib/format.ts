const usdFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const usdCompactFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatUsd = (value: number) => usdFormatter.format(value)
export const formatUsdCompact = (value: number) =>
  Math.abs(value) >= 10000 ? usdCompactFormatter.format(value) : usdFormatter.format(value)

const monthNames = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

export const MONTH_NAMES = monthNames

export function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-')
  return `${monthNames[Number(month) - 1]} ${year}`
}

export function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-')
  return `${Number(day)} ${monthNames[Number(month) - 1]} ${year}`
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
