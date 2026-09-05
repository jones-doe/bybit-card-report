import { formatUsd } from '@/lib/format'

export const Legend = ({ thresholds }: { thresholds: number[] }) => {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <span>меньше</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className="size-4 rounded-[4px]"
            style={{ backgroundColor: `var(--heat-${step})` }}
            title={
              thresholds.length === 3
                ? step === 1
                  ? `до ${formatUsd(thresholds[0])}`
                  : step === 4
                    ? `свыше ${formatUsd(thresholds[2])}`
                    : `${formatUsd(thresholds[step - 2])} – ${formatUsd(thresholds[step - 1])}`
                : undefined
            }
          />
        ))}
      </div>
      <span>больше</span>
    </div>
  )
}
