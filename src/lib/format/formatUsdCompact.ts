import { usdCompactFormatter, usdFormatter } from './usdFormatters'

export const formatUsdCompact = (value: number) =>
  Math.abs(value) >= 10000 ? usdCompactFormatter.format(value) : usdFormatter.format(value)
