import {
  CalendarDays,
  ListTodo,
  PawPrint,
  Search,
  ShoppingBasket,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoryLabel, expenseCategories, incomeCategories } from '../../data/catalog'
import { money } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import { Sheet } from '../ui/Sheet'

export function SearchOverlay({
  open,
  query,
  onQuery,
  onClose,
}: {
  open: boolean
  query: string
  onQuery: (value: string) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { state, household } = useStore()
  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!household || q.length < 2) return []
    const rows: { id: string; title: string; meta: string; href: string; icon: typeof Wallet }[] = []

    for (const t of state.transactions.filter((x) => x.householdId === household.id)) {
      const hay = `${t.description} ${t.category}`.toLowerCase()
      if (!hay.includes(q)) continue
      const cats = t.type === 'income' ? incomeCategories : expenseCategories
      rows.push({
        id: `tx-${t.id}`,
        title: t.description || categoryLabel(t.category, cats),
        meta: `${t.type === 'income' ? 'Ingreso' : 'Gasto'} · ${money(t.amount, household.currency)}`,
        href: '/finanzas',
        icon: Wallet,
      })
    }

    for (const s of state.shopping.filter((x) => x.householdId === household.id)) {
      if (!s.name.toLowerCase().includes(q)) continue
      rows.push({
        id: `sh-${s.id}`,
        title: s.name,
        meta: s.purchased ? 'Comprado' : 'Pendiente',
        href: '/compras',
        icon: ShoppingBasket,
      })
    }

    for (const m of state.members.filter((x) => x.householdId === household.id)) {
      if (!m.name.toLowerCase().includes(q)) continue
      rows.push({
        id: `mb-${m.id}`,
        title: m.name,
        meta: m.role === 'owner' ? 'Titular' : m.role === 'admin' ? 'Administrador' : 'Integrante',
        href: '/familia',
        icon: Users,
      })
    }

    for (const p of state.pets.filter((x) => x.householdId === household.id)) {
      if (!`${p.name} ${p.species}`.toLowerCase().includes(q)) continue
      rows.push({
        id: `pt-${p.id}`,
        title: p.name,
        meta: p.species,
        href: `/mascotas/${p.id}`,
        icon: PawPrint,
      })
    }

    for (const t of state.tasks.filter((x) => x.householdId === household.id)) {
      if (!t.title.toLowerCase().includes(q)) continue
      rows.push({
        id: `tk-${t.id}`,
        title: t.title,
        meta: t.done ? 'Completada' : 'Pendiente',
        href: '/tareas',
        icon: ListTodo,
      })
    }

    for (const e of state.events.filter((x) => x.householdId === household.id)) {
      if (!e.title.toLowerCase().includes(q)) continue
      rows.push({
        id: `ev-${e.id}`,
        title: e.title,
        meta: e.date,
        href: '/calendario',
        icon: CalendarDays,
      })
    }

    return rows.slice(0, 12)
  }, [household, q, state])

  return (
    <Sheet open={open} title="Buscar" onClose={onClose} wide>
      <div className="relative mb-4">
        <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-mute" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Movimientos, compras, familia..."
          className="h-11 w-full rounded-2xl border border-line bg-lift pr-3 pl-10 text-sm outline-none placeholder:text-mute focus:border-mint/40"
        />
      </div>
      {q.length < 2 ? (
        <p className="py-8 text-center text-sm text-mute">Escribe al menos dos letras.</p>
      ) : results.length === 0 ? (
        <p className="py-8 text-center text-sm text-mute">Sin coincidencias en este hogar.</p>
      ) : (
        <ul className="space-y-1">
          {results.map((row) => {
            const Icon = row.icon
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-lift"
                  onClick={() => {
                    navigate(row.href)
                    onClose()
                  }}
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-lift text-mute">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{row.title}</span>
                    <span className="block truncate text-xs text-mute">{row.meta}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
