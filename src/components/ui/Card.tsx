import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Card({
  className,
  children,
  padding = true,
}: {
  className?: string
  children: ReactNode
  padding?: boolean
}) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-line bg-card shadow-[0_8px_24px_rgba(0,0,0,0.28)]',
        padding && 'p-4',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function CardLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">{children}</p>
}
