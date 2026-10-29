import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { shortDate } from '../../lib/format'
import { eventTone, useStore } from '../../store/StoreProvider'

export function NotificationsPage() {
  const { stats } = useStore()

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold tracking-tight">Avisos</h1>
      <Card padding={false}>
        {stats.upcoming.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Sin avisos"
            text="Cuando haya pagos, tareas o vacunas próximas aparecerán aquí."
          />
        ) : (
          <ul className="divide-y divide-line">
            {stats.upcoming.map((item) => {
              const tone = eventTone(item.date)
              return (
                <li key={item.id}>
                  <Link to={item.href} className="flex items-center justify-between gap-3 px-4 py-3">
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
