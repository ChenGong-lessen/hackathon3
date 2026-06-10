import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/20 ring-1 ring-brand-700/20',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 ring-1 ring-slate-300',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 ring-1 ring-emerald-700/20',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm font-semibold',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
        'transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
