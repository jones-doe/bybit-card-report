/**
 * Quantile-bucketed scale for the calendar: four steps over the days that had
 * any spend, so a handful of huge days can't flatten everything else to step
 * 1 — matching GitHub's own 4-level (plus empty) contribution scale.
 */
export const makeHeatScale = (values: number[]) => {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return { level: () => 0, thresholds: [] as number[] }

  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
  const thresholds = [at(0.25), at(0.5), at(0.75)]

  const level = (value: number) => {
    if (value <= 0) return 0
    const exceeded = thresholds.filter((threshold) => value > threshold).length
    return Math.min(exceeded + 1, 4)
  }

  return { level, thresholds }
}
