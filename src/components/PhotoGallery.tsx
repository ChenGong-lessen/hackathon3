import { useState } from 'react'
import { Droplets, Flame, Plug, Wrench, DoorOpen, Thermometer, type LucideIcon } from 'lucide-react'
import type { Photo } from '@/data/types'
import { cn } from '@/lib/utils'

const iconMap: Record<Photo['icon'], LucideIcon> = {
  droplets: Droplets,
  flame: Flame,
  plug: Plug,
  wrench: Wrench,
  'door-open': DoorOpen,
  thermometer: Thermometer,
}

interface Props {
  photos: Photo[]
}

export function PhotoGallery({ photos }: Props) {
  const [active, setActive] = useState(0)
  const main = photos[active]
  const MainIcon = iconMap[main.icon]

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative h-40 overflow-hidden rounded-xl bg-gradient-to-br ring-1 ring-slate-200',
          main.gradient,
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <MainIcon className="h-14 w-14 text-white/30" strokeWidth={1.25} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-[11px] font-medium text-white/90">{main.caption}</p>
        </div>
        <div className="absolute top-2 right-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
          {active + 1} / {photos.length}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="flex gap-1.5">
          {photos.map((p, i) => {
            const Icon = iconMap[p.icon]
            return (
              <button
                key={p.id}
                onClick={() => setActive(i)}
                className={cn(
                  'relative h-12 w-16 overflow-hidden rounded-md bg-gradient-to-br ring-1 transition-all',
                  p.gradient,
                  i === active
                    ? 'ring-brand-500 ring-2'
                    : 'ring-slate-200 hover:ring-slate-300',
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white/60" strokeWidth={1.5} />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
