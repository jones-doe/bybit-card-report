import { MONTH_NAMES } from './monthNames'

export const formatMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}
