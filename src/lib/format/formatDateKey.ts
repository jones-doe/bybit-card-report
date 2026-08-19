import { MONTH_NAMES } from './monthNames'

export const formatDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-')
  return `${Number(day)} ${MONTH_NAMES[Number(month) - 1]} ${year}`
}
