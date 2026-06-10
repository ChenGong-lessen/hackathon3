import type { WorkOrder } from '../src/data/types'
import { workOrders as seed } from '../src/data/workOrders'

/**
 * Per-WO mutable state held in process memory. The seed array stays immutable
 * so a server restart returns the demo to a clean baseline.
 */
export interface WoState {
  approved: boolean
  approvedAt?: string
  dispatchedAt?: string
}

const byId = new Map<string, WorkOrder>(seed.map((wo) => [wo.id, wo]))
const stateById = new Map<string, WoState>(seed.map((wo) => [wo.id, { approved: false }]))

function ensureState(id: string): WoState {
  let s = stateById.get(id)
  if (!s) {
    s = { approved: false }
    stateById.set(id, s)
  }
  return s
}

/** Lightweight projection used by list endpoints. */
export interface WorkOrderSummary {
  id: string
  title: string
  priority: WorkOrder['priority']
  status: WorkOrder['status']
  createdAt: string
  assetName: string
  estimatedTotalCost: number
  goldenPathScore: number
  approved: boolean
}

export function listWorkOrders(): WorkOrderSummary[] {
  return seed.map((wo) => ({
    id: wo.id,
    title: wo.title,
    priority: wo.priority,
    status: wo.status,
    createdAt: wo.createdAt,
    assetName: wo.asset.name,
    estimatedTotalCost: wo.aiAnalysis.estimatedTotalCost,
    goldenPathScore: wo.aiAnalysis.goldenPathScore.score,
    approved: ensureState(wo.id).approved,
  }))
}

export function getWorkOrder(id: string): (WorkOrder & { state: WoState }) | null {
  const wo = byId.get(id)
  if (!wo) return null
  return { ...wo, state: ensureState(id) }
}

export function approveWorkOrder(id: string): WoState | null {
  if (!byId.has(id)) return null
  const s = ensureState(id)
  s.approved = true
  s.approvedAt = new Date().toISOString()
  return s
}

export function dispatchWorkOrder(id: string): WoState | null {
  if (!byId.has(id)) return null
  const s = ensureState(id)
  s.dispatchedAt = new Date().toISOString()
  return s
}
