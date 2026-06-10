import { ChevronRight, Truck, ScanSearch, Calculator, Bot } from 'lucide-react'
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

export function GoldenPathScoreCard({
  steps,
  totalAgents = 0,
  doneCount = totalAgents,
  currentActivity = null,
}: Props) {
  const stats = stepperStats(steps)
  const orchestrating = totalAgents > 0 && doneCount < totalAgents

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200">
      <div className="bg-slate-50/60 px-5 pb-5 pt-4">
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
