import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'urgent' | 'high' | 'normal' | 'auto' | 'wait' | 'exception' | 'muted' | 'brand'

const variants: Record<Variant, string> = {
  urgent:    'bg-red-50 text-red-700 ring-red-200',
  high:      'bg-amber-50 text-amber-700 ring-amber-200',
  normal:    'bg-slate-100 text-slate-700 ring-slate-200',
  auto:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  wait:      'bg-amber-50 text-amber-700 ring-amber-200',
  exception: 'bg-red-50 text-red-700 ring-red-200',
  muted:     'bg-slate-100 text-slate-600 ring-slate-200',
  brand:     'bg-brand-50 text-brand-700 ring-brand-200',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

export function Badge({ className, variant = 'muted', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'ring-1 ring-inset',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
