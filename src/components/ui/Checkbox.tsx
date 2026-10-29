import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="inline-flex items-center gap-3 text-left"
      aria-pressed={checked}
    >
      <span
        className={cn(
          'inline-flex size-5 items-center justify-center rounded-md border transition',
          checked ? 'border-mint bg-mint text-ink' : 'border-line bg-lift text-transparent',
        )}
      >
        <Check size={12} strokeWidth={3} />
      </span>
      {label ? <span className={cn('text-sm', checked && 'text-mute line-through')}>{label}</span> : null}
    </button>
  )
}
