import { cn } from '../../lib/cn'

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="inline-flex size-9 items-center justify-center rounded-2xl border border-line bg-lift">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 11.2 12 4.6l8 6.6V20a1.4 1.4 0 0 1-1.4 1.4h-4.4v-5.6H9.8v5.6H5.4A1.4 1.4 0 0 1 4 20V11.2Z"
            stroke="#55D6A0"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {compact ? null : (
        <span className="text-[17px] font-semibold tracking-tight">
          Hogar<span className="text-mint">360</span>
        </span>
      )}
    </div>
  )
}
