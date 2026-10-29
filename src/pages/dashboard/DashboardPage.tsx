import {
  Bell,
  CalendarDays,
  ChevronRight,
  ListTodo,
  PawPrint,
  Plus,
  ShoppingBasket,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppOutlet } from '../../components/layout/useAppOutlet'
import { Card, CardLabel } from '../../components/ui/Card'
import { Progress, budgetTone } from '../../components/ui/Progress'
import { money, shortDate } from '../../lib/format'
import { eventTone, useStore } from '../../store/StoreProvider'

const actions = [
  { to: '/compras', label: 'Compras', icon: ShoppingBasket },
  { to: 'gasto', label: 'Gasto', icon: Wallet },
  { to: '/tareas', label: 'Tareas', icon: ListTodo },
  { to: '/mascotas', label: 'Mascotas', icon: PawPrint },
  { to: '/calendario', label: 'Agenda', icon: CalendarDays },
  { to: 'recordatorio', label: 'Aviso', icon: Bell },
] as const

export function DashboardPage() {
  const { currentUser, household, households, setActiveHousehold, stats } = useStore()
  const { openExpense, openReminder } = useAppOutlet()
  const currency = household?.currency ?? 'CLP'
  const used = Math.round(stats.usedPct)

  return (
    <div className="space-y-5 lg:space-y-6">
      {households.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-none lg:hidden">
          {households.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveHousehold(h.id)}
              className={
                h.id === household?.id
                  ? 'h-8 shrink-0 rounded-full bg-mint/10 px-3 text-sm font-medium text-mint'
                  : 'h-8 shrink-0 rounded-full bg-lift px-3 text-sm text-mute'
              }
            >
              {h.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="bg-linear-to-br from-[#1a1a1a] to-[#0c0c0c] p-5 lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardLabel>Finanzas del hogar</CardLabel>
              <p className="mt-1 text-sm text-mute">{household?.name ?? currentUser?.name}</p>
            </div>
            <Link to="/finanzas" className="text-xs font-medium text-mint">
              Ver detalle
            </Link>
          </div>
          <p className="mt-6 text-[40px] leading-none font-extrabold tracking-tight">
            {money(stats.remaining, currency)}
          </p>
          <p className="mt-2 text-sm text-mute">Presupuesto restante este mes</p>
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-mute">
              <span>Presupuesto {money(household?.monthlyBudget ?? 0, currency)}</span>
              <span className={used >= 100 ? 'text-danger' : used >= 80 ? 'text-warn' : 'text-mint'}>
                {used}% usado
              </span>
            </div>
            <Progress value={stats.usedPct} tone={budgetTone(stats.usedPct)} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openExpense('income')}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-lift text-sm font-semibold"
            >
              <Plus size={16} />
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => openExpense('expense')}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-mint text-sm font-semibold text-ink"
            >
              <Plus size={16} />
              Gasto
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:col-span-5 lg:grid-cols-2">
          <MiniStat label="Gastos del mes" value={money(stats.monthExpenses, currency)} hint="Registrados" />
          <MiniStat
            label="Ahorro acumulado"
            value={money(stats.savings, currency)}
            hint={stats.savings >= 0 ? 'Ingresos − gastos' : 'En negativo'}
            warn={stats.savings < 0}
          />
          <MiniStat
            label="Compras pendientes"
            value={String(stats.pendingShopping)}
            hint={stats.pendingShopping ? money(stats.shoppingTotal, currency) : 'Lista al día'}
          />
          <MiniStat
            label="Próximos pagos"
            value={String(stats.upcoming.filter((u) => u.kind === 'payment').length)}
            hint="Próximos 21 días"
          />
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Accesos rápidos</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
          {actions.map((item) => {
            const Icon = item.icon
            if (item.to === 'gasto') {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => openExpense('expense')}
                  className="flex flex-col items-center gap-2 rounded-[22px] border border-line bg-card px-2 py-4"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-lift text-cream">
                    <Icon size={18} />
                  </span>
                  <span className="text-[12px] font-medium">{item.label}</span>
                </button>
              )
            }
            if (item.to === 'recordatorio') {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={openReminder}
                  className="flex flex-col items-center gap-2 rounded-[22px] border border-line bg-card px-2 py-4"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-lift text-cream">
                    <Icon size={18} />
                  </span>
                  <span className="text-[12px] font-medium">{item.label}</span>
                </button>
              )
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                className="flex flex-col items-center gap-2 rounded-[22px] border border-line bg-card px-2 py-4"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-lift text-cream">
                  <Icon size={18} />
                </span>
                <span className="text-[12px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Próximos acontecimientos</h2>
          <Link to="/calendario" className="inline-flex items-center gap-1 text-sm text-mint">
            Ver todos
            <ChevronRight size={14} />
          </Link>
        </div>
        {stats.upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-mute">
            Aún no hay pagos, tareas ni recordatorios próximos.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.upcoming.slice(0, 5).map((item) => {
              const tone = eventTone(item.date)
              return (
                <li key={item.id}>
                  <Link to={item.href} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-mute">{item.meta}</p>
                    </div>
                    <span
                      className={
                        tone === 'overdue'
                          ? 'text-xs text-danger'
                          : tone === 'soon'
                            ? 'text-xs text-warn'
                            : 'text-xs text-mute'
                      }
                    >
                      {shortDate(item.date)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function MiniStat({
  label,
  value,
  hint,
  warn,
}: {
  label: string
  value: string
  hint: string
  warn?: boolean
}) {
  return (
    <Card className="p-3.5">
      <p className="text-[11px] text-mute">{label}</p>
      <p className={`mt-2 text-xl font-semibold tracking-tight ${warn ? 'text-danger' : ''}`}>{value}</p>
      <p className="mt-1 text-[11px] text-mute">{hint}</p>
    </Card>
  )
}
