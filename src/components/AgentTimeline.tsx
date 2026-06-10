import { Truck, ScanSearch, Calculator, Bot, Brain, Check, Loader2, Circle, RotateCw } from 'lucide-react'
import type { AgentKind, AgentRun, AgentStatus } from '@/data/types'
import { cn } from '@/lib/utils'

interface Props {
  runs: AgentRun[]
  /** Number of agents (from the start of the runs array) that have finished. */
  doneCount: number
  /** True once the initial gray-pause is over and the orchestration is actually playing. */
  started: boolean
  /** Re-trigger the orchestration animation from the beginning. */
  onReplay: () => void
}

interface KindMeta {
  icon: typeof Truck
  role: string
  iconBg: string
  iconText: string
  iconRing: string
  cardBg: string
  cardRing: string
  chipBg: string
  chipText: string
}

const kindMeta: Record<AgentKind, KindMeta> = {
  intake:     { icon: Brain,      role: 'Path planning',         iconBg: 'bg-brand-100',   iconText: 'text-brand-700',   iconRing: 'ring-brand-200',   cardBg: 'bg-brand-50/50',   cardRing: 'ring-brand-100',   chipBg: 'bg-white',  chipText: 'text-brand-700'   },
  scheduling: { icon: Truck,      role: 'Vendor routing',        iconBg: 'bg-sky-100',     iconText: 'text-sky-700',     iconRing: 'ring-sky-200',     cardBg: 'bg-sky-50/40',     cardRing: 'ring-sky-100',     chipBg: 'bg-white',  chipText: 'text-sky-700'     },
  rescode:    { icon: ScanSearch, role: 'Fault classification',  iconBg: 'bg-violet-100',  iconText: 'text-violet-700',  iconRing: 'ring-violet-200',  cardBg: 'bg-violet-50/40',  cardRing: 'ring-violet-100',  chipBg: 'bg-white',  chipText: 'text-violet-700'  },
  estimator:  { icon: Calculator, role: 'Cost prediction',       iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', iconRing: 'ring-emerald-200', cardBg: 'bg-emerald-50/40', cardRing: 'ring-emerald-100', chipBg: 'bg-white',  chipText: 'text-emerald-700' },
}

const statusMeta: Record<AgentStatus, { icon: typeof Check; tint: string; label: string }> = {
  done:    { icon: Check,   tint: 'text-emerald-600',                 label: 'Done' },
  running: { icon: Loader2, tint: 'text-amber-600 animate-spin',      label: 'Running' },
  pending: { icon: Circle,  tint: 'text-slate-300',                   label: 'Pending' },
}

/** Resolve an agent's *visible* status during the orchestration animation. */
function effectiveStatus(index: number, doneCount: number, started: boolean, total: number): AgentStatus {
  if (index < doneCount) return 'done'
  if (started && index === doneCount && doneCount < total) return 'running'
  return 'pending'
}

const PENDING_TINT = {
  iconBg: 'bg-slate-100',
  iconText: 'text-slate-400',
  iconRing: 'ring-slate-200',
  cardBg: 'bg-slate-50/60',
  cardRing: 'ring-slate-200',
}

export function AgentTimeline({ runs, doneCount, started, onReplay }: Props) {
  const totalSec = runs.reduce((m, r) => Math.max(m, r.durationSec), 0)
  const complete = doneCount === runs.length

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-brand-200">
            <Bot className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Agent activity</h3>
            <p className="text-[11px] text-slate-500">
              {complete
                ? 'Specialized agents collaborated to build this passport'
                : started
                  ? `Planning execution path… (${doneCount}/${runs.length} agents done)`
                  : 'Initializing orchestration…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-slate-500">
            <div><span className="font-semibold text-slate-900 tabular-nums">{totalSec.toFixed(1)}s</span> end-to-end</div>
            <div>{runs.length} agents · sequential</div>
          </div>
          <button
            onClick={onReplay}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            title="Replay orchestration"
          >
            <RotateCw className="h-3 w-3" /> Replay
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute top-6 z-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"
          style={{ left: `${50 / runs.length}%`, right: `${50 / runs.length}%` }}
        />

        <ol className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${runs.length}, minmax(0, 1fr))` }}>
          {runs.map((run, i) => {
            const liveStatus = effectiveStatus(i, doneCount, started, runs.length)
            const km = kindMeta[run.kind]
            const sm = statusMeta[liveStatus]
            const Icon = km.icon
            const StatusIcon = sm.icon
            const isPending = liveStatus === 'pending'
            const tint = isPending ? PENDING_TINT : km
            return (
              <li
                key={run.kind}
                className={cn(
                  'relative flex flex-col rounded-xl p-3 ring-1 transition-colors duration-500',
                  tint.cardBg,
                  tint.cardRing,
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-2 ring-offset-2 ring-offset-white transition-colors duration-500',
                      tint.iconBg,
                      tint.iconRing,
                      liveStatus === 'running' && 'animate-pulse-soft',
                    )}
                  >
                    <Icon className={cn('h-5 w-5 transition-colors duration-500', tint.iconText)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('truncate text-sm font-semibold transition-colors', isPending ? 'text-slate-500' : 'text-slate-900')}>{run.name}</span>
                      <StatusIcon className={cn('h-3.5 w-3.5 flex-none', sm.tint)} />
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{km.role}</div>
                    <span className={cn('mt-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ring-1', km.chipBg, isPending ? 'text-slate-400' : km.chipText, isPending ? 'ring-slate-200' : km.cardRing)}>
                      {run.durationSec.toFixed(1)}s
                    </span>
                  </div>
                </div>
                <div className={cn('mt-3 transition-opacity duration-500', liveStatus === 'done' ? 'opacity-100' : 'opacity-40')}>
                  <div className={cn('text-sm font-medium leading-snug', liveStatus === 'done' ? 'text-slate-900' : 'text-slate-500')}>{run.headline}</div>
                  <div className="mt-1 text-[11px] leading-snug text-slate-600">{run.detail}</div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
