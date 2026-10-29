import { cn } from '../../lib/cn'

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition',
        active
          ? 'border-mint/40 bg-mint/10 text-mint'
          : 'border-line bg-lift text-mute hover:text-cream',
      )}
    >
      {children}
    </button>
  )
}
