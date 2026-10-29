import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Confirm } from '../../components/ui/Confirm'
import { EventSheet } from '../../features/calendar/EventSheet'
import { longDate, parseISO, todayISO } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import type { CalendarEvent } from '../../types'

const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { iso, inMonth: d.getMonth() === month, day: d.getDate() }
  })
}

export function CalendarPage() {
  const { household, state, stats, removeEvent } = useStore()
  const today = todayISO()
  const initial = parseISO(today)
  const [cursor, setCursor] = useState({ y: initial.getFullYear(), m: initial.getMonth() })
  const [selected, setSelected] = useState(today)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [removing, setRemoving] = useState<CalendarEvent | null>(null)

  const days = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor])
  const events = state.events.filter((e) => e.householdId === household?.id)
  const marked = new Set([
    ...events.map((e) => e.date),
    ...stats.upcoming.map((u) => u.date),
  ])
  const dayEvents = events.filter((e) => e.date === selected)
  const extras = stats.upcoming.filter((u) => u.date === selected && !u.id.startsWith('event-'))

  const title = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(
    new Date(cursor.y, cursor.m, 1),
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Calendario</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-3 text-sm font-semibold text-ink"
        >
          <Plus size={16} />
          Aviso
        </button>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="text-mute"
            onClick={() =>
              setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))
            }
          >
            <ChevronLeft />
          </button>
          <p className="text-sm font-semibold capitalize">{title}</p>
          <button
            type="button"
            className="text-mute"
            onClick={() =>
              setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))
            }
          >
            <ChevronRight />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-mute">
          {week.map((d, i) => (
            <span key={`${d}-${i}`} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((cell) => {
            const isSelected = cell.iso === selected
            const isToday = cell.iso === today
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => setSelected(cell.iso)}
                className={`flex h-11 flex-col items-center justify-center rounded-2xl text-sm ${
                  isSelected
                    ? 'bg-mint font-semibold text-ink'
                    : isToday
                      ? 'border border-mint/50 text-cream'
                      : cell.inMonth
                        ? 'text-cream'
                        : 'text-mute/40'
                }`}
              >
                {cell.day}
                {marked.has(cell.iso) && !isSelected ? (
                  <span className="mt-0.5 size-1 rounded-full bg-mint" />
                ) : (
                  <span className="mt-0.5 size-1" />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-[15px] font-semibold capitalize">{longDate(selected)}</h2>
        {dayEvents.length === 0 && extras.length === 0 ? (
          <p className="py-6 text-center text-sm text-mute">No hay acontecimientos este día.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {dayEvents.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setEditing(event)
                    setOpen(true)
                  }}
                >
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-mute">{event.note || event.kind}</p>
                </button>
                <button type="button" className="text-xs text-danger" onClick={() => setRemoving(event)}>
                  Quitar
                </button>
              </li>
            ))}
            {extras.map((item) => (
              <li key={item.id} className="py-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-mute">{item.meta}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EventSheet
        open={open}
        initialDate={selected}
        editing={editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
      <Confirm
        open={Boolean(removing)}
        title="Eliminar acontecimiento"
        text="Se quitará de la agenda del hogar."
        confirmLabel="Eliminar"
        danger
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removeEvent(removing.id)
        }}
      />
    </div>
  )
}
