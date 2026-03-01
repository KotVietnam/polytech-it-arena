import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface SharedProps {
  children: ReactNode
  className?: string
  variant?: ButtonVariant
  size?: ButtonSize
  ariaLabel?: string
}

type LinkButtonProps = SharedProps & {
  to: string
}

type NativeButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    to?: undefined
  }

type ButtonProps = LinkButtonProps | NativeButtonProps

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border border-red-600 bg-red-600 text-black hover:bg-red-500',
  outline: 'border border-red-700 bg-transparent text-red-300 hover:bg-red-700/15',
  ghost:
    'border border-zinc-700 bg-transparent text-zinc-100 hover:border-red-600 hover:text-red-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm sm:text-base',
  lg: 'h-11 px-5 text-base',
}

const sharedClassName = (
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) =>
  cn(
    'focus-ring mono relative inline-flex items-center justify-center overflow-hidden rounded-none font-semibold transition-all duration-200 before:absolute before:inset-y-0 before:left-[-60%] before:w-[28%] before:-skew-x-[20deg] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:opacity-0 before:transition-all before:duration-500 hover:before:left-[130%] hover:before:opacity-100',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )

export const Button = (props: ButtonProps) => {
  const variant = props.variant ?? 'primary'
  const size = props.size ?? 'md'

  if ('to' in props && props.to) {
    const { to, children, className, ariaLabel } = props
    return (
      <Link
        to={to}
        aria-label={ariaLabel}
        className={sharedClassName(variant, size, className)}
      >
        {children}
      </Link>
    )
  }

  const { children, className, ariaLabel, ...buttonProps } = props
  return (
    <button
      aria-label={ariaLabel}
      className={sharedClassName(variant, size, className)}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
