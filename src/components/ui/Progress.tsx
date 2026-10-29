import { clamp } from '../../lib/format'
import { cn } from '../../lib/cn'

export function Progress({ value, tone = 'mint' }: { value: number; tone?: 'mint' | 'warn' | 'danger' }) {
  const pct = clamp(value, 0, 100)
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-lift">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          tone === 'mint' && 'bg-mint',
          tone === 'warn' && 'bg-warn',
          tone === 'danger' && 'bg-danger',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function budgetTone(pct: number) {
  if (pct >= 100) return 'danger' as const
  if (pct >= 80) return 'warn' as const
  return 'mint' as const
}
