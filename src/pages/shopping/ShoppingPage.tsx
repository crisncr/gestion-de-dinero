import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Checkbox'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Progress, budgetTone } from '../../components/ui/Progress'
import { categoryLabel, shoppingCategories } from '../../data/catalog'
import { ItemSheet } from '../../features/shopping/ItemSheet'
import { money } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import type { ShoppingItem } from '../../types'

export function ShoppingPage() {
  const { household, state, stats, toggleShopping, removeShopping, clearPurchased } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ShoppingItem | null>(null)
  const [filter, setFilter] = useState('all')
  const currency = household?.currency ?? 'CLP'

  const items = useMemo(() => {
    return state.shopping
      .filter((s) => s.householdId === household?.id)
      .filter((s) => (filter === 'all' ? true : s.category === filter))
      .sort((a, b) => Number(a.purchased) - Number(b.purchased) || a.name.localeCompare(b.name))
  }, [filter, household?.id, state.shopping])

  const usedOfBudget =
    household && household.monthlyBudget > 0 ? (stats.shoppingTotal / household.monthlyBudget) * 100 : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Compras</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-3 text-sm font-semibold text-ink"
        >
          <Plus size={16} />
          Producto
        </button>
      </div>

      <Card className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-mute">Total pendiente</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{money(stats.shoppingTotal, currency)}</p>
          </div>
          <p className="text-sm text-mute">{stats.pendingShopping} productos</p>
        </div>
        <p className="mt-4 text-xs text-mute">
          Presupuesto disponible {money(Math.max(0, stats.remaining), currency)}
        </p>
        <div className="mt-2">
          <Progress value={usedOfBudget} tone={budgetTone(usedOfBudget)} />
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Todas
        </Chip>
        {shoppingCategories.map((c) => (
          <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <Card padding={false}>
        {items.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Lista vacía"
            text="Agrega productos para usar esta pantalla en el supermercado."
          />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox checked={item.purchased} onChange={() => toggleShopping(item.id)} />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setEditing(item)
                    setOpen(true)
                  }}
                >
                  <p className={`truncate text-sm font-medium ${item.purchased ? 'text-mute line-through' : ''}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-mute">
                    {categoryLabel(item.category, shoppingCategories)} · ×{item.quantity}
                  </p>
                </button>
                <span className="text-sm font-semibold">{money(item.price * item.quantity, currency)}</span>
                <button
                  type="button"
                  aria-label="Eliminar"
                  className="text-mute hover:text-danger"
                  onClick={() => removeShopping(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {items.some((i) => i.purchased) ? (
        <button type="button" onClick={clearPurchased} className="w-full text-center text-sm text-mute">
          Quitar productos comprados
        </button>
      ) : null}

      <ItemSheet
        open={open}
        editing={editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
