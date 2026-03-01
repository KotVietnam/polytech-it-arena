import { cn } from '../utils/cn'

interface SectionTitleProps {
  eyebrow?: string
  title: string
  description?: string
  className?: string
}

export const SectionTitle = ({
  eyebrow,
  title,
  description,
  className,
}: SectionTitleProps) => (
  <div className={cn('space-y-2', className)}>
    {eyebrow ? (
      <p className="mono text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="mono text-2xl font-bold uppercase tracking-wide sm:text-3xl">
      {title}
    </h2>
    {description ? (
      <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
        {description}
      </p>
    ) : null}
  </div>
)
