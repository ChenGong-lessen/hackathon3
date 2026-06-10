import type { WorkOrder, WoPriority, WoStatus } from '@/data/types'

export interface WorkOrderSummary {
  id: string
  title: string
  priority: WoPriority
  status: WoStatus
  createdAt: string
  assetName: string
  estimatedTotalCost: number
  goldenPathScore: number
  approved: boolean
}

export interface WoState {
  approved: boolean
  approvedAt?: string
  dispatchedAt?: string
}

/** WorkOrder enriched with the server's per-WO mutable state. */
export type WorkOrderWithState = WorkOrder & { state: WoState }

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${init?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`)
  }
  return (await res.json()) as T
}

export function getWorkOrders(): Promise<{ items: WorkOrderSummary[] }> {
  return request('/work-orders')
}

export function getWorkOrder(id: string): Promise<WorkOrderWithState> {
  return request(`/work-orders/${encodeURIComponent(id)}`)
}

export function approveWorkOrder(id: string): Promise<{ id: string; state: WoState }> {
  return request(`/work-orders/${encodeURIComponent(id)}/approve`, { method: 'POST' })
}

export function dispatchWorkOrder(id: string): Promise<{ id: string; state: WoState }> {
  return request(`/work-orders/${encodeURIComponent(id)}/dispatch`, { method: 'POST' })
}
