import { Bell, ChevronDown, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/StoreProvider'
import { SearchOverlay } from '../search/SearchOverlay'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/IconButton'
import { Sheet } from '../ui/Sheet'

export function TopBar({
  onAddExpense,
  onAddReminder,
}: {
  onAddExpense: () => void
  onAddReminder: () => void
}) {
  const navigate = useNavigate()
  const { currentUser, household, households, setActiveHousehold, stats } = useStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [homeOpen, setHomeOpen] = useState(false)
  const [plusOpen, setPlusOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-ink/90 px-4 py-3 backdrop-blur-md lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5">
          <button type="button" onClick={() => navigate('/ajustes')} className="lg:hidden">
            <Avatar name={currentUser?.name ?? 'Hogar'} />
          </button>

          <button
            type="button"
            onClick={() => setHomeOpen(true)}
            className="hidden min-w-0 items-center gap-2 rounded-full border border-line bg-lift px-3 py-2 lg:flex"
          >
            <span className="max-w-36 truncate text-sm font-medium">{household?.name ?? 'Hogar'}</span>
            <ChevronDown size={14} className="text-mute" />
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-lift px-3.5 text-left text-sm text-mute"
          >
            <Search size={16} />
            <span className="truncate">Buscar en el hogar</span>
          </button>

          <IconButton label="Notificaciones" onClick={() => navigate('/notificaciones')} className="relative">
            <Bell size={18} />
            {stats.upcoming.length > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-mint" />
            ) : null}
          </IconButton>
          <IconButton label="Acciones" onClick={() => setPlusOpen(true)}>
            <Plus size={18} />
          </IconButton>
        </div>
      </header>

      <SearchOverlay
        open={searchOpen}
        query={query}
        onQuery={setQuery}
        onClose={() => {
          setSearchOpen(false)
          setQuery('')
        }}
      />

      <Sheet open={homeOpen} title="Cambiar hogar" onClose={() => setHomeOpen(false)}>
        <ul className="space-y-2">
          {households.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-left"
                onClick={() => {
                  setActiveHousehold(h.id)
                  setHomeOpen(false)
                }}
              >
                <span className="font-medium">{h.name}</span>
                {h.id === household?.id ? <span className="text-xs text-mint">Activo</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={plusOpen} title="Acciones rápidas" onClose={() => setPlusOpen(false)}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Agregar gasto', action: onAddExpense },
            { label: 'Lista de compras', action: () => navigate('/compras') },
            { label: 'Nueva tarea', action: () => navigate('/tareas') },
            { label: 'Recordatorio', action: onAddReminder },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className="rounded-2xl border border-line bg-card px-3 py-4 text-sm font-medium"
              onClick={() => {
                setPlusOpen(false)
                item.action()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
