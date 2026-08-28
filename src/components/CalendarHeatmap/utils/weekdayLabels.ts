import { addDays, eachDayOfInterval, format, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'

// Any Monday works — only the weekday name is used, not the date itself.
const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
const week = eachDayOfInterval({ start: monday, end: addDays(monday, 6) })

/** Column headers for a Monday-start week. */
export const WEEKDAY_LABELS = week.map((day) => format(day, 'EEEEEE', { locale: ru }))
