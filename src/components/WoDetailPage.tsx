import { useState, useMemo, useEffect } from 'react'
import type { WorkOrder } from '@/data/types'
import { WoHeader } from './WoHeader'
import { WoDetailsCard } from './WoDetailsCard'
import { AiSuggestionPanel } from './AiSuggestionPanel'
import { GoldenPathScoreCard } from './GoldenPathScoreCard'

interface Props {
  wo: WorkOrder
  /** Optional side-effect (e.g. backend POST) fired alongside the local approval transition. */
  onApprove?: () => void
}

/** Each agent gets this wall-clock window; its stream lines are evenly distributed inside. */
const AGENT_INTERVAL_MS = 1200
/** Initial pause before the first agent kicks off, so the all-gray state is visible. */
const ORCHESTRATION_INITIAL_DELAY_MS = 200

export function WoDetailPage({ wo, onApprove }: Props) {
  const [approved, setApproved] = useState(false)
  const [doneCount, setDoneCount] = useState(0)
  /** Index into the currently-running agent's `stream` array. null = no agent currently streaming. */
  const [activeStream, setActiveStream] = useState<{ agentIndex: number; lineIndex: number } | null>(null)

  useEffect(() => {
    setApproved(false)
    setDoneCount(0)
    setActiveStream(null)

    const timers: number[] = []
    wo.aiAnalysis.agentRuns.forEach((run, agentIndex) => {
      const streamLen = run.stream?.length ?? 0
      const linePeriod = streamLen > 0 ? AGENT_INTERVAL_MS / streamLen : AGENT_INTERVAL_MS
      const agentStart = ORCHESTRATION_INITIAL_DELAY_MS + agentIndex * AGENT_INTERVAL_MS

      for (let lineIndex = 0; lineIndex < streamLen; lineIndex++) {
        const t = agentStart + lineIndex * linePeriod
        timers.push(window.setTimeout(() => setActiveStream({ agentIndex, lineIndex }), t))
      }
      const completeAt = agentStart + AGENT_INTERVAL_MS
      timers.push(
        window.setTimeout(() => {
          setDoneCount(agentIndex + 1)
          if (agentIndex === wo.aiAnalysis.agentRuns.length - 1) setActiveStream(null)
        }, completeAt),
      )
    })
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [wo.id, wo.aiAnalysis.agentRuns])

  const completedAgents = useMemo(
    () => new Set(wo.aiAnalysis.agentRuns.slice(0, doneCount).map((r) => r.kind)),
    [wo.aiAnalysis.agentRuns, doneCount],
  )
  const totalAgents = wo.aiAnalysis.agentRuns.length
  const orchestrationComplete = doneCount === totalAgents

  /** Continuous 0..1 progress: complete agents + fractional progress of the running one. */
  const orchestrationProgress = useMemo(() => {
    if (orchestrationComplete) return 1
    let fractional = 0
    if (activeStream) {
      const run = wo.aiAnalysis.agentRuns[activeStream.agentIndex]
      const streamLen = run?.stream?.length ?? 0
      if (streamLen > 0) fractional = (activeStream.lineIndex + 1) / streamLen
    }
    return Math.min(1, (doneCount + fractional) / totalAgents)
  }, [activeStream, doneCount, totalAgents, orchestrationComplete, wo.aiAnalysis.agentRuns])

  /** What the ticker should currently display, or null when no agent is streaming. */
  const currentActivity = useMemo(() => {
    if (!activeStream || orchestrationComplete) return null
    const run = wo.aiAnalysis.agentRuns[activeStream.agentIndex]
    if (!run) return null
    return {
      kind: run.kind,
      name: run.name,
      line: run.stream?.[activeStream.lineIndex] ?? '',
      agentNumber: activeStream.agentIndex + 1,
      totalAgents,
    }
  }, [activeStream, orchestrationComplete, wo.aiAnalysis.agentRuns, totalAgents])

  const displayedSteps = useMemo(() => {
    // 1) Start from the final state and (optionally) apply approval transformation.
    const base = !approved
      ? wo.goldenPath
      : wo.goldenPath.map((s, i, arr) => {
          if (s.status === 'in-progress') return { ...s, status: 'done-auto' as const, detail: `Dispatched to ${wo.aiAnalysis.recommendedVendor.name} · ETA ${wo.aiAnalysis.recommendedVendor.eta}` }
          if (i > 0 && arr[i - 1].status === 'in-progress' && s.status === 'pending') {
            return { ...s, status: 'in-progress' as const }
          }
          return s
        })
    // 2) Mask steps whose driving agent hasn't completed yet → render as pending.
    return base.map((s) =>
      s.drivenBy && !completedAgents.has(s.drivenBy) ? { ...s, status: 'pending' as const } : s,
    )
  }, [wo.goldenPath, wo.aiAnalysis.recommendedVendor, approved])

  return (
    <div className="min-h-screen">
      <WoHeader wo={wo} />

      <main className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        <div className="animate-fade-in-up">
          <GoldenPathScoreCard
            key={wo.id}
            score={wo.aiAnalysis.goldenPathScore}
            steps={displayedSteps}
            approved={approved}
            completedAgents={completedAgents}
            totalAgents={totalAgents}
            doneCount={doneCount}
            orchestrationProgress={orchestrationProgress}
            currentActivity={currentActivity}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <WoDetailsCard wo={wo} />
          </div>
          <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <AiSuggestionPanel
              wo={wo}
              approved={approved}
              orchestrationComplete={orchestrationComplete}
              onApprove={() => {
                setApproved(true)
                onApprove?.()
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
