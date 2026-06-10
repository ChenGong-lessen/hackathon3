import { useEffect, useState } from 'react'
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

/** Reveals `text` one character at a time. Restarts whenever `text` changes. */
function Typewriter({ text, speed = 28 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown('')
    let i = 0
    const id = window.setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
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

  useEffect(() => {
    setLoadedCount(0)
  }, [stepsKey, scoringComplete])

  useEffect(() => {
    let convId : string = '';
    if (!scoringComplete) return
    if (loadedCount >= steps.length) return
    if (loadedCount === 0) {
      fetch(OneBrain_Init, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then((res) => res.json().then((data) => {
          convId = data.id
        }))
        .then(() => {
          fetch(OneBrain_API + convId, { 
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({     
              "is_streaming_msg": true,
              "text": "Create a work order with water heater issue.",
              "states": [] 
            })
          }).then((res) => {
            res.json()
            .then((data) => {
              console.log('data', data)
              steps[loadedCount].detail = data.text
              setLoadedCount((n) => n + 1);
            })
        })
        .catch((err) => {
          console.error(err)
        })
      })
    } else {
      let cancelled = false
      setTimeout(() => {
        console.log('loadedCount', loadedCount)    
        fetch(OneBrain_API + convId, { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({     
            "is_streaming_msg": true,
            "text": "Proceed",
            "states": [
                {
                    "key": "database_type",
                    "value": "mysql"
                },
                {
                    "key": "data_source_name",
                    "value": "gsmp"
                },
                {
                    "key": "entity_data_providers",
                    "value": "fuzzy-sharp-membase, fuzzy-sharp-csv"
                },
                {
                    "key": "entity_graph_id",
                    "value": "691b8ccdb7054ef1b8c193fe"
                },
                {
                    "key": "membase_access_token",
                    "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI2OTI1ZWJkNGNmMzE3ZDc1NDY1NDgxZTciLCJ1bmlxdWVfbmFtZSI6Im9uZWJyYWluLWRldiIsImF1dGhtZXRob2QiOiJwcm9qZWN0X2tleSIsImF1dGhfcHJvdmlkZXIiOiJtZW1iYXNlIiwib3JnX2lkIjoiNjg1MDMwNDdjNTc5NmE4MDQ5NjM0YTRmIiwicHJval9pZCI6IjY4NTAzMDQ3YzU3OTZhODA0OTYzNGE1MSIsIm5iZiI6MTc2NDA5Mjg4NCwiZXhwIjoxNzk1NjI4ODg0LCJpYXQiOjE3NjQwOTI4ODQsImlzcyI6Im1lbWJhc2UiLCJhdWQiOiJtZW1iYXNlIn0.xcrQs0AUM03PfFyQU3vz7BuMREes76Xbb6iO_DWJhUk"
                }
            ],
            "postback": {
                "payload": "Please tell me the total number of WCPVI reactive work order of IH?"
            }
          })
        })
        .then((res) => {
          res.json()
          .then(() => {
            console.log('loadedCount', loadedCount)
            if (!cancelled) setLoadedCount((n) => n + 1)
          })
        })
        .catch((err) => {
          console.error(err)
          if (!cancelled) setLoadedCount((n) => n + 1)
        })
      }, 5000);
      return () => {
        cancelled = true
      }
    }
  }, [loadedCount, steps.length, scoringComplete])

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
              {step.detail && displayStatus === 'done-auto' && (
                <div className={cn('mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed', meta.detailText)}>
                  <Typewriter text={step.detail} />
                </div>
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
