import { cn } from '@/lib/utils'

interface Props {
  value: number // 0..1
  className?: string
  showLabel?: boolean
}

export function ConfidenceBar({ value, className, showLabel = true }: Props) {
  const pct = Math.round(value * 100)
  const tone =
    value >= 0.85 ? 'bg-red-500'
    : value >= 0.7  ? 'bg-brand-500'
    : value >= 0.5  ? 'bg-amber-500'
    : 'bg-red-500'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn('h-full rounded-full transition-all duration-500', tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 text-right text-xs font-medium tabular-nums text-slate-600">
          {pct}%
        </span>
      )}
    </div>
  )
}
