import { Star, Navigation, Clock, Phone } from 'lucide-react'
import type { Vendor } from '@/data/types'
import { Badge } from './ui/Badge'

interface Props {
  vendor: Vendor
}

export function VendorCard({ vendor }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 ring-1 ring-brand-200">
        <span className="text-sm font-bold text-brand-700">
          {vendor.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{vendor.name}</span>
          {vendor.onCall && <Badge variant="auto">On-call</Badge>}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {vendor.rating}
          </span>
          <span className="inline-flex items-center gap-1">
            <Navigation className="h-3 w-3" /> {vendor.distanceKm} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> ETA {vendor.eta}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {vendor.specialty.map((s) => (
            <span key={s} className="rounded-md bg-white px-1.5 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200">
              {s}
            </span>
          ))}
        </div>
      </div>
      <button className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-900">
        <Phone className="h-4 w-4" />
      </button>
    </div>
  )
}
