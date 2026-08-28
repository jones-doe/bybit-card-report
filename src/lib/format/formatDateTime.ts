import { format } from 'date-fns'

export const formatDateTime = (ts: number) => format(ts, 'dd.MM.yyyy, HH:mm')
