import { Check, SkipForward, Loader2, Sparkles, Circle, User, Clock } from 'lucide-react'
import type { PathStep, PathStepStatus } from '@/data/types'
import { cn } from '@/lib/utils'

interface Props {
  steps: PathStep[]
}

const statusMeta: Record<PathStepStatus, { ring: string; bg: string; icon: typeof Check; label: string; textTone: string }> = {
  'done-auto':   { ring: 'ring-emerald-300', bg: 'bg-emerald-100 text-emerald-700', icon: Sparkles,    label: 'AI auto',     textTone: 'text-emerald-700' },
  'done-manual': { ring: 'ring-slate-300',   bg: 'bg-slate-100 text-slate-700',     icon: User,        label: 'Manual',      textTone: 'text-slate-700'   },
  'skipped':     { ring: 'ring-brand-300',   bg: 'bg-brand-100 text-brand-700',     icon: SkipForward, label: 'Skipped',     textTone: 'text-brand-700'   },
  'auto-future': { ring: 'ring-brand-200',   bg: 'bg-brand-50 text-brand-600',      icon: Clock,       label: 'AI later',    textTone: 'text-brand-600'   },
  'in-progress': { ring: 'ring-amber-300',   bg: 'bg-amber-100 text-amber-700 animate-pulse-soft', icon: Loader2, label: 'In progress', textTone: 'text-amber-700' },
  'pending':     { ring: 'ring-slate-200',   bg: 'bg-slate-50 text-slate-400',      icon: Circle,      label: 'Pending',     textTone: 'text-slate-400'   },
}

/** Inner steps row — no Card wrapper. Used by GoldenPathScoreCard for the merged hero. */
export function GoldenPathStepsRow({ steps }: Props) {
  return (
    <ol className="relative flex items-start justify-between gap-2 px-1 pt-2 pb-1">
      {steps.map((step, i) => {
        const meta = statusMeta[step.status]
        const Icon = meta.icon
        const isLast = i === steps.length - 1
        return (
          <li key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
            {!isLast && (
              <div
                className={cn(
                  'absolute top-7 z-0 h-px transition-colors duration-500',
                  'left-[calc(50%+1.5rem)] w-[calc(100%-3rem)]',
                  step.status === 'pending' ? 'bg-slate-200' : 'bg-gradient-to-r from-brand-400 to-slate-200',
                )}
              />
            )}
            <div
              className={cn(
                'relative z-10 flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-slate-50 transition-all duration-500',
                meta.ring,
                meta.bg,
              )}
            >
              <Icon className={cn('h-4 w-4 transition-colors duration-500', step.status === 'in-progress' && 'animate-spin')} />
            </div>
            <div className="mt-2 px-1">
              <div className="text-[11px] font-medium text-slate-700 leading-tight">{step.label}</div>
              <div className={cn('mt-0.5 text-[10px] font-medium', meta.textTone)}>{meta.label}</div>
              {step.detail && (
                <div className="mt-1 text-[10px] leading-tight text-slate-500">{step.detail}</div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function stepperStats(steps: PathStep[]) {
  // Only credit minutes saved for steps the AI has already revealed as auto-handled.
  // Pending steps haven't been "decided" yet, so they shouldn't count toward the savings tally.
  const totalSaved = steps.reduce(
    (acc, s) =>
      acc +
      (s.status === 'done-auto' || s.status === 'skipped' || s.status === 'auto-future'
        ? s.minutesSaved ?? 0
        : 0),
    0,
  )
  const aiHandled = steps.filter(
    (s) => s.status === 'done-auto' || s.status === 'skipped' || s.status === 'auto-future',
  ).length
  const manualCount = steps.filter(
    (s) => s.status === 'done-manual' || s.status === 'in-progress' || s.status === 'pending',
  ).length
  return { totalSaved, aiHandled, manualCount, total: steps.length }
}

export function formatTimeSaved(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours >= 10 ? `${Math.round(hours)} hr` : `${hours.toFixed(1)} hr`
}
