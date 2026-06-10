import { useEffect, useState } from 'react'
import { WoDetailPage } from './components/WoDetailPage'
import { workOrders } from './data/workOrders'
import type { WorkOrder } from './data/types'
import { approveWorkOrder, getWorkOrder, getWorkOrders } from './lib/api'

export default function App() {
  // Page 2 focuses on the main urgent WO as the demo "wow moment".
  const fallback = workOrders[0]
  const [wo, setWo] = useState<WorkOrder | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await getWorkOrders()
        const targetId = list.items[0]?.id ?? fallback.id
        const detail = await getWorkOrder(targetId)
        if (!cancelled) {
          // Strip server-only state field; the page works on the bare WorkOrder shape.
          const { state: _state, ...bare } = detail
          setWo(bare)
        }
      } catch (err) {
        console.warn('[api] falling back to static seed:', err)
        if (!cancelled) setWo(fallback)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fallback])

  if (!wo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading work order…
      </div>
    )
  }

  return (
    <WoDetailPage
      wo={wo}
      onApprove={() => {
        approveWorkOrder(wo.id).catch((err) => console.warn('[api] approve failed:', err))
      }}
    />
  )
}
