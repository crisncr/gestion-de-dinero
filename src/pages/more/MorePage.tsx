import { Bell, CalendarDays, ListTodo, PawPrint, Settings, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'

const links = [
  { to: '/mascotas', label: 'Mascotas', text: 'Vacunas, peso y cuidados', icon: PawPrint },
  { to: '/tareas', label: 'Tareas', text: 'Pendientes del hogar', icon: ListTodo },
  { to: '/calendario', label: 'Calendario', text: 'Pagos y recordatorios', icon: CalendarDays },
  { to: '/familia', label: 'Invitaciones', text: 'Código e integrantes', icon: Users },
  { to: '/notificaciones', label: 'Avisos', text: 'Lo que vence pronto', icon: Bell },
  { to: '/ajustes', label: 'Ajustes', text: 'Perfil, hogar y sesión', icon: Settings },
]

export function MorePage() {
  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold tracking-tight">Más</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to}>
              <Card className="flex items-center gap-3 p-4">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-lift">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-mute">{item.text}</span>
                </span>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
