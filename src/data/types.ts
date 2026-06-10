export type WoPriority = 'urgent' | 'high' | 'normal'
export type WoStatus =
  | 'new'
  | 'auto-routed'
  | 'vendor-action'
  | 'exception'
  | 'completed'

export interface Asset {
  id: string
  name: string
  type: string
  location: string
  installedYear: number
  lastServiced: string
}

export interface Reporter {
  name: string
  unit: string
  contact: string
}

export interface Photo {
  id: string
  caption: string
  /** Tailwind gradient classes used as an offline-friendly visual */
  gradient: string
  /** Lucide icon name to overlay */
  icon: 'droplets' | 'flame' | 'plug' | 'wrench' | 'door-open' | 'thermometer'
}

export type LineItemSection = 'incurred' | 'proposal'

export interface LineItem {
  /** Where this row belongs in the proposal layout */
  section: LineItemSection
  code: string
  description: string
  /** Sub-label shown below the description, e.g. "Investigate / diagnose with no repairs" */
  sublabel?: string
  /** AI confidence in this specific line item (0..1) */
  confidence: number
  unit: string
  unitPrice: number
  /** Suggested qty; vendor confirms / overrides */
  suggestedQty: number
}

export interface SimilarWO {
  id: string
  title: string
  /** 0..1 */
  similarity: number
  resolvedIn: string
  outcome: string
}

export interface Vendor {
  id: string
  name: string
  rating: number
  distanceKm: number
  eta: string
  specialty: string[]
  onCall: boolean
}

export interface ScoreDriver {
  /** Positive contributor (+) or negative drag (−) on the score */
  sign: '+' | '-'
  text: string
  /** Which agent's completion reveals this driver (for orchestration animation) */
  drivenBy?: AgentKind
}

export interface GoldenPathScore {
  /** 0..100 — predicted probability the WO completes on the golden path without intervention */
  score: number
  drivers: ScoreDriver[]
  /** Optional bonus drivers appended after the user approves dispatch (for live demo) */
  onApproveBonus?: { scoreDelta: number; drivers: ScoreDriver[] }
}

/** Specialized agents that collaborate to triage a work order. */
export type AgentKind = 'intake' | 'scheduling' | 'rescode' | 'estimator'

export type AgentStatus = 'done' | 'running' | 'pending'

export interface AgentRun {
  kind: AgentKind
  /** Display name, e.g. "Scheduling Agent" */
  name: string
  /** Wall-clock duration in seconds (cumulative end-time from t=0) */
  durationSec: number
  /** Verb-led headline, e.g. "Matched on-call vendor" */
  headline: string
  /** Supporting detail / evidence line */
  detail: string
  status: AgentStatus
  /** "Thinking" log lines streamed while this agent is running. Last line is usually the conclusion. */
  stream?: string[]
}

export interface AiAnalysis {
  /** Overall confidence in the auto-route decision */
  confidence: number
  canAutoRoute: boolean
  rationale: string[]
  /** AI-drafted "Description of services" paragraph for the proposal */
  descriptionOfServices: string
  predictedLineItems: LineItem[]
  similarWOs: SimilarWO[]
  recommendedVendor: Vendor
  estimatedTotalCost: number
  estimatedResolutionHours: number
  goldenPathScore: GoldenPathScore
  /** Per-agent activity log shown in the AI Triage panel */
  agentRuns: AgentRun[]
}

export type PathStepStatus =
  | 'done-auto'
  | 'done-manual'
  | 'skipped'
  | 'auto-future'
  | 'in-progress'
  | 'pending'

export interface PathStep {
  id: string
  label: string
  status: PathStepStatus
  detail?: string
  /** Minutes saved vs. traditional flow */
  minutesSaved?: number
  /** Which agent's completion reveals / decides this step (for orchestration animation) */
  drivenBy?: AgentKind
}

export interface WorkOrder {
  id: string
  title: string
  description: string
  priority: WoPriority
  status: WoStatus
  createdAt: string
  asset: Asset
  reporter: Reporter
  photos: Photo[]
  aiAnalysis: AiAnalysis
  goldenPath: PathStep[]
}
