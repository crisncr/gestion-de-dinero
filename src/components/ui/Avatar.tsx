import { cn } from '../../lib/cn'
import { initials } from '../../lib/format'

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-lift font-semibold text-mint',
        size === 'sm' && 'size-8 text-[11px]',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-14 text-lg',
        className,
      )}
    >
      {initials(name) || 'H'}
    </span>
  )
}
