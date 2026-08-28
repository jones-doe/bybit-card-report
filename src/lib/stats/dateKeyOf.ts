import { format } from 'date-fns'

/** Local calendar day of a timestamp, as YYYY-MM-DD. */
export const dateKeyOf = (ts: number): string => format(ts, 'yyyy-MM-dd')
