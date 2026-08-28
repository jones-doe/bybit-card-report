import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export const formatMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number)
  return format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: ru })
}
