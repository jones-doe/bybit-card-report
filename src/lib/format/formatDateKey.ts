import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export const formatDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return format(new Date(year, month - 1, day), 'd MMMM yyyy', { locale: ru })
}
