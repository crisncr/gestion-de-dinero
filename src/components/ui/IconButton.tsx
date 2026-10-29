import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function IconButton({
  className,
  children,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-lift text-cream transition hover:bg-card',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
