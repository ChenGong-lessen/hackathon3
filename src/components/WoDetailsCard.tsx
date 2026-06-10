import { MapPin, User, Calendar, Wrench } from 'lucide-react'
import type { WorkOrder } from '@/data/types'
import { Card, CardHeader, CardTitle, CardBody } from './ui/Card'
import { PhotoGallery } from './PhotoGallery'

interface Props {
  wo: WorkOrder
}

export function WoDetailsCard({ wo }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work order details</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-xs leading-snug text-slate-700">{wo.description}</p>

        <PhotoGallery photos={wo.photos} />

        <div className="grid grid-cols-1 gap-2">
          <InfoRow icon={Wrench} label="Asset" value={wo.asset.name} sub={wo.asset.type} />
          <InfoRow icon={MapPin} label="Location" value={wo.asset.location} />
          <InfoRow icon={User} label="Reporter" value={wo.reporter.name} sub={`Unit ${wo.reporter.unit} · ${wo.reporter.contact}`} />
          <InfoRow
            icon={Calendar}
            label="Asset history"
            value={`Installed ${wo.asset.installedYear}`}
            sub={`Last serviced ${wo.asset.lastServiced}`}
          />
        </div>
      </CardBody>
    </Card>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Wrench
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        <div className="truncate text-xs font-medium text-slate-900">{value}</div>
        {sub && <div className="truncate text-[11px] text-slate-500">{sub}</div>}
      </div>
    </div>
  )
}
