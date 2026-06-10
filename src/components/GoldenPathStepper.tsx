import { useEffect, useRef, useState } from 'react'
import { Check, SkipForward, Loader2, Sparkles, Circle, User, Clock } from 'lucide-react'
import type { PathStep, PathStepStatus } from '@/data/types'
import { cn } from '@/lib/utils'

interface Props {
  steps: PathStep[]
  /** When false, all steps stay pending and no coffee API calls are made.
   *  Flip to true once the Golden Path score has finished calculating. */
  scoringComplete?: boolean
}

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTAxNzMyIiwianRpIjoiZjJlOGEwOTctNTNhYy00YjRkLTkwZTEtYmMwOGJkNGYzNTg2IiwidWlkIjoiMTEwMTczMiIsInJvbGVfdHlwZV9pZCI6IjEiLCJhZmZpbGlhdGVfaWQiOiIiLCJjbGllbnRfaWQiOiIiLCJsb2NhdGlvbl9pZCI6IiIsIm5hbWUiOiIxMDM5NDIiLCJmdWxsX25hbWUiOiJZYW5hbiBXYW5nIiwiZW1haWwiOiJ5d2FuZ0BzbXNhc3Npc3QuY29tIiwicm9sZV9pZHMiOiIxMDEsMTU5NywzMDYiLCJkZXBhcnRtZW50cyI6IjMiLCJhYl9mZWF0dXJlcyI6IiIsImV4cCI6MTc4MjMyOTA0NiwiaXNzIjoiU01TQVNTSVNULkNPTSIsImF1ZCI6IlNNU0FTU0lTVCJ9.Vw5f-OHb0347D-jFwbJDjcJKoUQopG0WMMrbPIiQGXs'
const OneBrain_Init = '/api/conversation/a8fa9b3a-ab3a-417a-9537-965d99f752d3'
const OneBrain_API = '/api/conversation/a8fa9b3a-ab3a-417a-9537-965d99f752d3/'

/** Renders nothing; just fires `onMount` once after mount. Used to advance the
 *  pipeline for steps that have no detail text to type out. */
function NoDetailAdvance({ onMount }: { onMount: () => void }) {
  const firedRef = useRef(false)
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    onMount()
    // onMount is intentionally not in deps — we only want to fire once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

/** Reveals `text` one character at a time. Restarts whenever `text` changes.
 *  Fires `onDone` exactly once per `text` value, when the full string has been shown. */
function Typewriter({ text, speed = 5, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [shown, setShown] = useState('')
  // Latest-callback ref so identity changes to `onDone` don't restart typing.
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])
  useEffect(() => {
    setShown('')
    if (!text) return
    let i = 0
    const id = window.setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) {
        window.clearInterval(id)
        onDoneRef.current?.()
      }
    }, speed)
    return () => window.clearInterval(id)
  }, [text, speed])
  const done = shown.length >= text.length
  return (
    <>
      {shown}
      {!done && <span className="ml-0.5 inline-block w-1 -translate-y-[1px] animate-pulse-soft text-brand-500">▍</span>}
    </>
  )
}

const statusMeta: Record<
  PathStepStatus,
  { ring: string; bg: string; icon: typeof Check; label: string; textTone: string; detailBg: string; detailRing: string; detailAccent: string; detailText: string }
> = {
  'done-auto':   { ring: 'ring-emerald-300', bg: 'bg-emerald-100 text-emerald-700', icon: Sparkles,    label: 'AI auto',     textTone: 'text-emerald-700',
                   detailBg: 'bg-gradient-to-br from-white via-emerald-50/70 to-emerald-100/40', detailRing: 'ring-emerald-200/80', detailAccent: 'from-emerald-400 to-emerald-600', detailText: 'text-emerald-900' },
  'done-manual': { ring: 'ring-slate-300',   bg: 'bg-slate-100 text-slate-700',     icon: User,        label: 'Manual',      textTone: 'text-slate-700',
                   detailBg: 'bg-gradient-to-br from-white via-slate-50 to-slate-100/60',        detailRing: 'ring-slate-200',     detailAccent: 'from-slate-400 to-slate-600',     detailText: 'text-slate-800'   },
  'skipped':     { ring: 'ring-brand-300',   bg: 'bg-brand-100 text-brand-700',     icon: SkipForward, label: 'Skipped',     textTone: 'text-brand-700',
                   detailBg: 'bg-gradient-to-br from-white via-brand-50/70 to-brand-100/40',     detailRing: 'ring-brand-200/80',  detailAccent: 'from-brand-400 to-brand-600',     detailText: 'text-brand-900'   },
  'auto-future': { ring: 'ring-brand-200',   bg: 'bg-brand-50 text-brand-600',      icon: Clock,       label: 'AI later',    textTone: 'text-brand-600',
                   detailBg: 'bg-gradient-to-br from-white via-brand-50/50 to-brand-50',         detailRing: 'ring-brand-200/70',  detailAccent: 'from-brand-300 to-brand-500',     detailText: 'text-brand-800'   },
  'in-progress': { ring: 'ring-amber-300',   bg: 'bg-amber-100 text-amber-700 animate-pulse-soft', icon: Loader2, label: 'In progress', textTone: 'text-amber-700',
                   detailBg: 'bg-gradient-to-br from-white via-amber-50/70 to-amber-100/40',     detailRing: 'ring-amber-200/80',  detailAccent: 'from-amber-400 to-amber-600',     detailText: 'text-amber-900'   },
  'pending':     { ring: 'ring-slate-200',   bg: 'bg-slate-50 text-slate-400',      icon: Circle,      label: 'Pending',     textTone: 'text-slate-400',
                   detailBg: 'bg-gradient-to-br from-white via-slate-50 to-slate-100/40',        detailRing: 'ring-slate-200',     detailAccent: 'from-slate-300 to-slate-400',     detailText: 'text-slate-500'   },
}

/** Inner steps row — no Card wrapper. Used by GoldenPathScoreCard for the merged hero. */
export function GoldenPathStepsRow({ steps, scoringComplete = true }: Props) {
  // Sequential reveal: each step is "loaded" only after a coffee API call resolves for it.
  // Loading is gated on `scoringComplete` so it doesn't start until the Golden Path score
  // has finished calculating. Before then, every step renders as 'pending'.
  const stepsKey = steps.map((s) => s.id).join('|')
  const [loadedCount, setLoadedCount] = useState(0)
  // How many steps' Typewriter animations have finished. Used to gate the next
  // API call so it only fires after the previous step's text has fully rendered.
  const [typedCount, setTypedCount] = useState(0)
  // Per-step detail overrides keyed by step id, populated from API responses.
  // Avoids mutating the `steps` prop directly.
  const [detailOverrides, setDetailOverrides] = useState<Record<string, string>>({})
  // Always-fresh ref to `steps` so the fetch effect can read the latest array
  // without having `steps` in its dependency list (which would re-fire on every
  // parent render that hands us a new array reference).
  const stepsRef = useRef(steps)
  useEffect(() => { stepsRef.current = steps }, [steps])
  // Tracks which `loadedCount` slots have already had a fetch started for them.
  // Survives StrictMode's mount → unmount → mount cycle, so the same slot is
  // never fetched twice. Cleared by the reset effect when the work order changes.
  const startedRef = useRef<Set<number>>(new Set())

  // Conversation id is obtained on the first step by hitting OneBrain_Init, then
  // reused for every subsequent message call.
  const convIdRef = useRef<string | null>(null)

  useEffect(() => {
    setLoadedCount(0)
    setTypedCount(0)
    setDetailOverrides({})
    startedRef.current = new Set()
    convIdRef.current = null
  }, [stepsKey, scoringComplete])

  const authHeaders = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  }

  useEffect(() => {
    if (!scoringComplete) return
    const currentSteps = stepsRef.current
    if (loadedCount >= currentSteps.length) return
    // Gate: only fire the next call once the previous step's typewriter has
    // finished. For slot N, that means typedCount must be >= N.
    if (typedCount < loadedCount) return
    // One fetch per slot, ever — protects against StrictMode double-invoke and
    // any incidental re-runs from parent re-renders.
    if (startedRef.current.has(loadedCount)) return
    startedRef.current.add(loadedCount)

    const isFirst = loadedCount === 0
    const stepId = currentSteps[loadedCount].id
    const body = isFirst
      ? { is_streaming_msg: true, text: 'Create a work order with water heater issue.', states: [] }
      : { is_streaming_msg: true, text: 'Proceed' }

    // Step 0 must first call the init endpoint to obtain a fresh convId, then
    // send the message. Later steps reuse the convId stored in convIdRef.
    const ensureConvId = (): Promise<string> => {
      if (convIdRef.current) return Promise.resolve(convIdRef.current)
      return fetch(OneBrain_Init, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) })
        .then((res) => res.json())
        .then((initData) => {
          const cid: string | undefined =
            initData?.id ?? initData?.conversation_id ?? initData?.convId ?? initData?.data?.id
          if (!cid) throw new Error('OneBrain init response missing convId: ' + JSON.stringify(initData))
          convIdRef.current = cid
          return cid
        })
    }

    ensureConvId()
      .then((cid) =>
        fetch(OneBrain_API + cid, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(body),
        }),
      )
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.text === 'string') {
          setDetailOverrides((prev) => ({ ...prev, [stepId]: data.text }))
        }
        setLoadedCount((n) => n + 1)
      })
      .catch((err) => {
        console.error(err)
        setLoadedCount((n) => n + 1)
      })
  }, [loadedCount, typedCount, stepsKey, scoringComplete])

  return (
    <ol className="relative flex flex-col gap-3 px-1 pt-2 pb-1">
      {steps.map((step, i) => {
        // Icon + label only render once loadedCount has reached this step.
        // Anything further out stays hidden until its turn comes.
        if (i > loadedCount) return null
        // Status is driven entirely by the API call lifecycle:
        //   call in flight → 'in-progress', response received → 'done-auto'.
        const displayStatus: PathStepStatus = i < loadedCount ? 'done-auto' : 'in-progress'
        const meta = statusMeta[displayStatus]
        const Icon = meta.icon
        return (
          <li
            key={step.id}
            className={cn(
              'group/card relative animate-fade-in-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition-all duration-300 hover:-translate-y-px hover:shadow-md',
              meta.detailRing,
            )}
          >
            {/* Soft tinted wash that picks up the status color */}
            <span className={cn('pointer-events-none absolute inset-0 opacity-70', meta.detailBg)} />
            {/* Left accent stripe */}
            <span className={cn('pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b', meta.detailAccent)} />
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 flex-none items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition-all duration-500',
                    meta.ring,
                    meta.bg,
                  )}
                >
                  <Icon className={cn('h-4 w-4 transition-colors duration-500', displayStatus === 'in-progress' && 'animate-spin')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] font-semibold tabular-nums text-slate-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800">{step.label}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1',
                    meta.detailBg,
                    meta.detailRing,
                    meta.textTone,
                  )}
                >
                  {meta.label}
                </span>
              </div>
              {(() => {
                const detail = detailOverrides[step.id] ?? step.detail
                if (displayStatus !== 'done-auto') return null
                // Step is "typed" once its Typewriter finishes; for steps with no
                // detail text, advance immediately so the next API call isn't stalled.
                const markTyped = () => setTypedCount((n) => Math.max(n, i + 1))
                if (!detail) {
                  return <NoDetailAdvance onMount={markTyped} />
                }
                return (
                  <div className={cn('mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed', meta.detailText)}>
                    <Typewriter text={detail} onDone={markTyped} />
                  </div>
                )
              })()}
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
