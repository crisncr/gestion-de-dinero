import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardLabel } from '../../components/ui/Card'
import { Chip } from '../../components/ui/Chip'
import { Confirm } from '../../components/ui/Confirm'
import { EmptyState } from '../../components/ui/EmptyState'
import { Progress, budgetTone } from '../../components/ui/Progress'
import { categoryAccent, categoryLabel, expenseCategories, incomeCategories } from '../../data/catalog'
import { TransactionSheet } from '../../features/finance/TransactionSheet'
import { money, monthKey, monthTitle, shortDate } from '../../lib/format'
import { useStore } from '../../store/StoreProvider'
import type { Transaction, TxType } from '../../types'

export function FinancePage() {
  const { household, state, stats, removeTransaction } = useStore()
  const [month, setMonth] = useState(monthKey())
  const [type, setType] = useState<'all' | TxType>('all')
  const [sheet, setSheet] = useState(false)
  const [initialType, setInitialType] = useState<TxType>('expense')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [removing, setRemoving] = useState<Transaction | null>(null)
  const currency = household?.currency ?? 'CLP'

  const months = useMemo(() => {
    const keys = new Set(state.transactions.filter((t) => t.householdId === household?.id).map((t) => t.date.slice(0, 7)))
    keys.add(monthKey())
    return [...keys].sort().reverse()
  }, [household?.id, state.transactions])

  const rows = useMemo(() => {
    return state.transactions
      .filter((t) => t.householdId === household?.id && t.date.startsWith(month))
      .filter((t) => (type === 'all' ? true : t.type === type))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [household?.id, month, state.transactions, type])

  const pie = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of rows.filter((r) => r.type === 'expense')) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    return [...map.entries()].map(([id, value]) => ({
      id,
      name: categoryLabel(id, expenseCategories),
      value,
      color: categoryAccent(id),
    }))
  }, [rows])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight">Finanzas</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setInitialType('expense')
            setSheet(true)
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-3 text-sm font-semibold text-ink"
        >
          <Plus size={16} />
          Movimiento
        </button>
      </div>

      <Card className="bg-linear-to-br from-[#1a1a1a] to-[#0c0c0c] p-5">
        <CardLabel>Disponible este mes</CardLabel>
        <p className="mt-3 text-4xl font-extrabold tracking-tight">{money(stats.remaining, currency)}</p>
        <p className="mt-2 text-sm text-mute">
          Presupuesto {money(household?.monthlyBudget ?? 0, currency)} · {Math.round(stats.usedPct)}% usado
        </p>
        <div className="mt-4">
          <Progress value={stats.usedPct} tone={budgetTone(stats.usedPct)} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[11px] text-mute">Ingresos</p>
          <p className="mt-2 text-xl font-semibold text-mint">{money(stats.monthIncome, currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-mute">Gastos</p>
          <p className="mt-2 text-xl font-semibold">{money(stats.monthExpenses, currency)}</p>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {months.map((m) => (
          <Chip key={m} active={month === m} onClick={() => setMonth(m)}>
            {monthTitle(m)}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2">
        {(['all', 'expense', 'income'] as const).map((value) => (
          <Chip
            key={value}
            active={type === value}
            onClick={() => setType(value)}
          >
            {value === 'all' ? 'Todos' : value === 'expense' ? 'Gastos' : 'Ingresos'}
          </Chip>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-[15px] font-semibold">Distribución de gastos</h2>
        {pie.length === 0 ? (
          <p className="py-8 text-center text-sm text-mute">Registra gastos para ver la distribución.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="h-48 min-w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none">
                    {pie.map((slice) => (
                      <Cell key={slice.id} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#151515', border: '1px solid #303030', borderRadius: 12 }}
                    formatter={(value) => money(Number(value), currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2">
              {pie.map((slice) => (
                <li key={slice.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-mute">
                    <span className="size-2 rounded-full" style={{ background: slice.color }} />
                    {slice.name}
                  </span>
                  <span>{money(slice.value, currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card padding={false}>
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-semibold">Historial</h2>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Sin movimientos"
            text="Registra un ingreso o gasto para comenzar el mes."
          />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => {
              const cats = row.type === 'income' ? incomeCategories : expenseCategories
              return (
                <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: categoryAccent(row.category) }}
                  />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setEditing(row)
                      setSheet(true)
                    }}
                  >
                    <p className="truncate text-sm font-medium">
                      {row.description || categoryLabel(row.category, cats)}
                    </p>
                    <p className="text-xs text-mute">
                      {categoryLabel(row.category, cats)} · {shortDate(row.date)}
                    </p>
                  </button>
                  <span className={row.type === 'income' ? 'text-sm font-semibold text-mint' : 'text-sm font-semibold'}>
                    {row.type === 'income' ? '+' : '−'}
                    {money(row.amount, currency)}
                  </span>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    className="text-mute hover:text-danger"
                    onClick={() => setRemoving(row)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <TransactionSheet
        open={sheet}
        initialType={editing?.type ?? initialType}
        editing={editing}
        onClose={() => {
          setSheet(false)
          setEditing(null)
        }}
      />
      <Confirm
        open={Boolean(removing)}
        title="Eliminar movimiento"
        text="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removeTransaction(removing.id)
        }}
      />
    </div>
  )
}
