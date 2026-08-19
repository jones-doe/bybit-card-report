/**
 * Quantile-bucketed scale for the calendar: five steps over the days that had
 * any spend, so a handful of huge days can't flatten everything else to step 1.
 */
export function makeHeatScale(values: number[]) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return { level: () => 0, thresholds: [] as number[] }

  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
  const thresholds = [at(0.2), at(0.4), at(0.6), at(0.8)]

  const level = (value: number) => {
    if (value <= 0) return 0
    let step = 1
    for (const threshold of thresholds) {
      if (value > threshold) step += 1
    }
    return Math.min(step, 5)
  }

  return { level, thresholds }
}
