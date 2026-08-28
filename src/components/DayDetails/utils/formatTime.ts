import { format } from 'date-fns'

export const formatTime = (ts: number) => format(ts, 'HH:mm')
