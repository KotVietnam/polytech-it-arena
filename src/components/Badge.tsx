import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'track' | 'level'
}

const badgeVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'border-zinc-600 bg-black text-zinc-300',
  track: 'border-red-700 bg-red-700/15 text-red-300',
  level: 'border-red-500 bg-red-600 text-black',
}

export const Badge = ({ className, variant = 'neutral', ...props }: BadgeProps) => (
  <span
    className={cn(
      'mono inline-flex items-center rounded-none border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
      badgeVariants[variant],
      className,
    )}
    {...props}
  />
)
