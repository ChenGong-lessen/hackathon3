import { useEffect, useMemo, useRef, useState } from 'react'
import { Compass, TrendingUp, Plus, Minus, Loader2, ChevronRight, Truck, ScanSearch, Calculator, Bot } from 'lucide-react'
import type { AgentKind, GoldenPathScore, PathStep } from '@/data/types'
import { GoldenPathStepsRow, stepperStats, formatTimeSaved } from './GoldenPathStepper'

interface CurrentActivity {
  kind: AgentKind
  name: string
  line: string
  agentNumber: number
  totalAgents: number
}

interface Props {
  score: GoldenPathScore
  steps: PathStep[]
  approved: boolean
  /** Agents that have completed so far — drivers tied to them become visible. */
  completedAgents?: Set<AgentKind>
  /** Total number of agents in this orchestration run. */
  totalAgents?: number
  /** How many agents have completed so far. */
  doneCount?: number
  /** Continuous 0..1 progress (complete agents + fractional progress of the running one). */
  orchestrationProgress?: number
  /** Currently-streaming agent + the latest "thinking" line to display in the ticker. */
  currentActivity?: CurrentActivity | null
}

const agentChipMeta: Record<AgentKind, { icon: typeof Bot; bg: string; text: string; ring: string }> = {
  intake:     { icon: Bot,         bg: 'bg-brand-50',   text: 'text-brand-700',   ring: 'ring-brand-200' },
  scheduling: { icon: Truck,       bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-200' },
  rescode:    { icon: ScanSearch,  bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200' },
  estimator:  { icon: Calculator,  bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
}

function tierFor(n: number) {
  if (n >= 85) return { label: 'Autopilot ready', color: 'emerald', ring: 'ring-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', glow: 'bg-emerald-100/60', bar: 'bg-emerald-500' }
  if (n >= 65) return { label: 'Recommended · awaiting approval', color: 'amber', ring: 'ring-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', glow: 'bg-amber-100/60', bar: 'bg-amber-500' }
  return { label: 'Judgment required', color: 'rose', ring: 'ring-rose-200', text: 'text-rose-700', bg: 'bg-rose-50', glow: 'bg-rose-100/60', bar: 'bg-rose-500' }
}

/** Smoothly tween a displayed number toward `target` over `duration` ms. */
function useTweenedNumber(target: number, duration = 500): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const start = fromRef.current
    const end = target
    if (start === end) return
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const ease = 1 - Math.pow(1 - t, 3)
      const v = Math.round(start + (end - start) * ease)
      setValue(v)
      fromRef.current = v
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

export function GoldenPathScoreCard({
  score,
  steps,
  approved,
  completedAgents,
  totalAgents = 0,
  doneCount = totalAgents,
  orchestrationProgress = 1,
  currentActivity = null,
}: Props) {
  const stats = stepperStats(steps)
  const orchestrating = totalAgents > 0 && doneCount < totalAgents

  const { finalScore, drivers, delta } = useMemo(() => {
    if (approved && score.onApproveBonus) {
      const next = Math.min(100, score.score + score.onApproveBonus.scoreDelta)
      return {
        finalScore: next,
        drivers: [...score.drivers, ...score.onApproveBonus.drivers],
        delta: score.onApproveBonus.scoreDelta,
      }
    }
    return { finalScore: score.score, drivers: score.drivers, delta: 0 }
  }, [score, approved])

  // Score climbs continuously with orchestrationProgress; tween smooths the per-stream jumps.
  const targetScore = orchestrating
    ? Math.round(finalScore * orchestrationProgress)
    : finalScore
  const current = useTweenedNumber(targetScore, 900)

  // Drivers without `drivenBy` are always shown; otherwise gated by agent completion.
  const visibleDrivers = useMemo(
    () => drivers.filter((d) => !d.drivenBy || !completedAgents || completedAgents.has(d.drivenBy)),
    [drivers, completedAgents],
  )

  const tier = tierFor(current)

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${tier.ring}`}
    >
      <div className={`pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full ${tier.glow} blur-3xl`} />

      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[280px_1fr]">
        <div className="flex flex-col justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-brand-200">
              <Compass className="h-4 w-4 text-brand-600" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Golden Path Score</span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold tabular-nums text-slate-900">{current}</span>
              <span className="text-lg text-slate-500">/ 100</span>
              {delta > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <TrendingUp className="h-3 w-3" /> +{delta}
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${tier.bar} transition-all duration-500`} style={{ width: `${current}%` }} />
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-md ${orchestrating ? 'bg-slate-100 text-slate-600 ring-slate-200' : `${tier.bg} ${tier.text} ${tier.ring}`} px-2 py-0.5 text-[11px] font-semibold ring-1`}>
              {orchestrating ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Scoring… {doneCount}/{totalAgents} agents</>
              ) : (
                tier.label
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Score drivers
          </div>
          <ul className="flex flex-wrap gap-2">
            {visibleDrivers.map((d) => (
              <li
                key={d.text}
                className={
                  'animate-fade-in-up ' +
                  (d.sign === '+'
                    ? 'inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800'
                    : 'inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800')
                }
              >
                {d.sign === '+' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                <span>{d.text}</span>
              </li>
            ))}
            {orchestrating && visibleDrivers.length < drivers.length && (
              <li className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Agents gathering evidence… ({drivers.length - visibleDrivers.length} more)</span>
              </li>
            )}
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            Predicts the probability this work order completes on the golden path with no dispatcher intervention.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/60 px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          {currentActivity ? (
            (() => {
              const chip = agentChipMeta[currentActivity.kind]
              const ChipIcon = chip.icon
              return (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className={`inline-flex flex-none items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${chip.bg} ${chip.text} ${chip.ring}`}>
                    <ChipIcon className="h-3 w-3" />
                    {currentActivity.name}
                    <span className="ml-0.5 text-slate-400">{currentActivity.agentNumber}/{currentActivity.totalAgents}</span>
                  </span>
                  <ChevronRight className="h-3 w-3 flex-none text-slate-300" />
                  <span
                    key={`${currentActivity.kind}-${currentActivity.line}`}
                    className="min-w-0 flex-1 animate-fade-in-up truncate font-mono text-[11px] text-slate-600"
                    title={currentActivity.line}
                  >
                    {currentActivity.line}
                    <span className="ml-1 inline-block w-1 -translate-y-[1px] animate-pulse-soft text-brand-500">▍</span>
                  </span>
                </div>
              )
            })()
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pipeline progress</span>
          )}
          <div className="flex flex-none items-center gap-3 text-xs">
            <span className="text-slate-600">
              AI compressed <span className="font-semibold text-slate-900 tabular-nums">{stats.total}</span> →{' '}
              <span className="font-semibold text-brand-700 tabular-nums">{stats.manualCount}</span> manual touchpoints
            </span>
            {stats.totalSaved > 0 && (
              <span className="text-slate-600">
                · ~<span className="font-semibold text-emerald-700">{formatTimeSaved(stats.totalSaved)}</span> saved
              </span>
            )}
          </div>
        </div>
        <GoldenPathStepsRow steps={steps} scoringComplete={!orchestrating} />
      </div>
    </section>
  )
}
