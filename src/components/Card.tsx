import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card = ({ className, hoverable, ...props }: CardProps) => (
  <div
    className={cn(
      'hud-card glass-card p-5 motion-safe:animate-reveal-up sm:p-6',
      hoverable &&
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-red-600 hover:bg-red-600 hover:text-black',
      className,
    )}
    {...props}
  />
)
