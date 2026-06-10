import { Sparkles, User } from 'lucide-react'
import type { LineItem } from '@/data/types'
import { cn, formatCurrency } from '@/lib/utils'

export type ProposalMode = 'ai' | 'vendor'

export interface ProposalCalc {
  perRow: Record<string, number | null>
  incurredSubtotal: number
  proposalSubtotal: number
  grandTotal: number
  anyQty: boolean
}

interface Props {
  descriptionOfServices: string
  items: LineItem[]
  mode: ProposalMode
  qtys: Record<string, string>
  onQtyChange: (code: string, value: string) => void
  onToggleMode: () => void
  calc: ProposalCalc
}

export function ProposalTable({
  descriptionOfServices, items, mode, qtys, onQtyChange, onToggleMode, calc,
}: Props) {
  const incurred = items.filter((i) => i.section === 'incurred')
  const proposal = items.filter((i) => i.section === 'proposal')

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Predicted proposal</h4>
          <span className="text-[10px] text-brand-600">
            {mode === 'vendor' ? 'Vendor view · enter actual Qty' : 'AI suggested · vendor confirms Qty'}
          </span>
        </div>
        <button
          onClick={onToggleMode}
          className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
        >
          {mode === 'vendor' ? (
            <><Sparkles className="h-3.5 w-3.5" /> Show AI suggestion</>
          ) : (
            <><User className="h-3.5 w-3.5" /> Preview vendor view</>
          )}
        </button>
      </div>

      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Description of services</div>
        <p className="text-xs leading-relaxed text-slate-700">{descriptionOfServices}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="w-20 px-3 py-2">Qty</th>
              <th className="px-3 py-2">Description</th>
              <th className="w-24 px-3 py-2 text-right">Unit Price</th>
              <th className="w-24 px-3 py-2 text-right">Net Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {incurred.length > 0 && (
              <>
                <SectionHeaderRow tone="muted">Incurred Costs · Investigate / diagnose</SectionHeaderRow>
                {incurred.map((it) => (
                  <Row key={it.code} item={it} mode={mode} value={qtys[it.code] ?? ''} onChange={onQtyChange} net={calc.perRow[it.code]} />
                ))}
                <SubtotalRow value={calc.anyQty ? formatCurrency(calc.incurredSubtotal) : '—'} />
              </>
            )}
            <SectionHeaderRow tone="brand">Proposal Description · Repair</SectionHeaderRow>
            {proposal.map((it) => (
              <Row key={it.code} item={it} mode={mode} value={qtys[it.code] ?? ''} onChange={onQtyChange} net={calc.perRow[it.code]} />
            ))}
            <SubtotalRow value={calc.anyQty ? formatCurrency(calc.proposalSubtotal) : '—'} />
            <tr className="bg-brand-50 text-sm">
              <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wider text-brand-700">Grand Total</td>
              <td className="px-3 py-2 text-right text-base font-bold tabular-nums text-brand-700">
                {calc.anyQty ? formatCurrency(calc.grandTotal) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        AI suggests <span className="text-slate-600">Qty</span> from similar resolved WOs.
        Vendor confirms or overrides Qty on dispatch — Net Price &amp; totals recalculate live.
      </p>
    </div>
  )
}

function SectionHeaderRow({ tone, children }: { tone: 'muted' | 'brand'; children: React.ReactNode }) {
  return (
    <tr>
      <td
        colSpan={4}
        className={cn(
          'px-3 py-2 text-[10px] font-semibold uppercase tracking-wider',
          tone === 'brand' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600',
        )}
      >
        {children}
      </td>
    </tr>
  )
}

function SubtotalRow({ value }: { value: string }) {
  return (
    <tr className="bg-slate-50 text-sm">
      <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">Sub-Total</td>
      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{value}</td>
    </tr>
  )
}

function Row({
  item, mode, value, onChange, net,
}: {
  item: LineItem; mode: ProposalMode; value: string; onChange: (code: string, v: string) => void; net: number | null
}) {
  const conf = Math.round(item.confidence * 100)
  const confTone = item.confidence >= 0.9 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'
  return (
    <tr className="text-sm">
      <td className="px-3 py-3">
        <input
          value={value}
          readOnly={mode === 'ai'}
          inputMode="decimal"
          placeholder={mode === 'vendor' ? `AI: ${item.suggestedQty}` : '—'}
          onChange={(e) => onChange(item.code, e.target.value)}
          className={cn(
            'w-14 rounded-md border px-1.5 py-1 text-right text-sm tabular-nums',
            mode === 'ai'
              ? 'border-slate-200 bg-slate-50 italic text-emerald-700'
              : 'border-brand-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          )}
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-900">{item.description}</span>
          {item.section === 'proposal' && (
            <span className={cn('rounded-full px-1.5 py-0 text-[9px] font-medium ring-1', confTone)}>{conf}%</span>
          )}
        </div>
        {item.sublabel && <div className="font-mono text-[11px] text-slate-500">{item.code} · {item.sublabel}</div>}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{formatCurrency(item.unitPrice)}</td>
      <td className={cn('px-3 py-3 text-right font-medium tabular-nums', net != null ? 'text-slate-900' : 'text-slate-400')}>
        {net != null ? formatCurrency(net) : '—'}
      </td>
    </tr>
  )
}
