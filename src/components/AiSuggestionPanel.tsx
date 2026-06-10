import { useMemo, useState } from 'react'
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { WorkOrder } from '@/data/types'
import { Card, CardHeader, CardTitle, CardBody } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ProposalTable, type ProposalMode, type ProposalCalc } from './ProposalTable'
import { VendorCard } from './VendorCard'
import { formatCurrency } from '@/lib/utils'

interface Props {
  wo: WorkOrder
  onApprove: () => void
  approved: boolean
  /** Disable the approve CTA until all orchestration agents have completed. */
  orchestrationComplete?: boolean
}

function makeAiQtys(items: WorkOrder['aiAnalysis']['predictedLineItems']) {
  return Object.fromEntries(items.map((i) => [i.code, String(i.suggestedQty)]))
}
function makeEmptyQtys(items: WorkOrder['aiAnalysis']['predictedLineItems']) {
  return Object.fromEntries(items.map((i) => [i.code, '']))
}

export function AiSuggestionPanel({ wo, onApprove, approved, orchestrationComplete = true }: Props) {
  const { aiAnalysis: ai } = wo
  const canRoute = ai.canAutoRoute

  const [mode, setMode] = useState<ProposalMode>('ai')
  const [qtys, setQtys] = useState<Record<string, string>>(() => makeAiQtys(ai.predictedLineItems))

  const calc = useMemo<ProposalCalc>(() => {
    let incurred = 0
    let proposal = 0
    let anyQty = false
    const perRow: Record<string, number | null> = {}
    ai.predictedLineItems.forEach((it) => {
      const q = parseFloat(qtys[it.code] ?? '')
      if (!isNaN(q)) {
        anyQty = true
        const n = q * it.unitPrice
        perRow[it.code] = n
        if (it.section === 'incurred') incurred += n
        else proposal += n
      } else {
        perRow[it.code] = null
      }
    })
    return { perRow, incurredSubtotal: incurred, proposalSubtotal: proposal, grandTotal: incurred + proposal, anyQty }
  }, [ai.predictedLineItems, qtys])

  const toggleMode = () => {
    const next: ProposalMode = mode === 'ai' ? 'vendor' : 'ai'
    setMode(next)
    setQtys(next === 'ai' ? makeAiQtys(ai.predictedLineItems) : makeEmptyQtys(ai.predictedLineItems))
  }
  const onQtyChange = (code: string, value: string) => setQtys((s) => ({ ...s, [code]: value }))

  return (
    <Card className="relative overflow-hidden ring-1 ring-brand-200">
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl" />

      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-brand-200">
            <Sparkles className="h-4 w-4 text-brand-600" />
          </div>
          <CardTitle className="text-brand-700">AI Triage</CardTitle>
        </div>
        <Badge variant={canRoute ? 'auto' : 'exception'}>
          {canRoute ? (
            <><CheckCircle2 className="h-3 w-3" /> Ready to auto-route</>
          ) : (
            <><AlertTriangle className="h-3 w-3" /> Needs human judgment</>
          )}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-5">
        {ai.predictedLineItems.length > 0 && (
          <ProposalTable
            descriptionOfServices={ai.descriptionOfServices}
            items={ai.predictedLineItems}
            mode={mode}
            qtys={qtys}
            onQtyChange={onQtyChange}
            onToggleMode={toggleMode}
            calc={calc}
          />
        )}

        <Section title="Recommended vendor">
          <VendorCard vendor={ai.recommendedVendor} />
        </Section>

        {canRoute && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <Stat label="Estimated cost" value={calc.anyQty ? formatCurrency(calc.grandTotal) : '—'} />
              <Stat label="Estimated time" value={`${ai.estimatedResolutionHours} hrs`} />
            </div>
            <Button
              size="lg"
              variant={approved ? 'success' : 'primary'}
              onClick={onApprove}
              disabled={approved || !orchestrationComplete}
              className="w-full"
            >
              {approved ? (
                <><CheckCircle2 className="h-4 w-4" /> Dispatched to {ai.recommendedVendor.name}</>
              ) : !orchestrationComplete ? (
                <>Agents planning…</>
              ) : (
                <>Approve &amp; Auto-dispatch <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              You can override line items before dispatch · Audit trail recorded
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</h4>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}
