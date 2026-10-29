import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-lift text-mute">
        <Icon size={22} />
      </span>
      <p className="text-[15px] font-semibold text-cream">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-mute">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
