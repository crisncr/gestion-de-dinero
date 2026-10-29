import {
  CalendarDays,
  Ellipsis,
  Home,
  ListTodo,
  PawPrint,
  Settings,
  ShoppingBasket,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  match?: string[]
}

export const mobileNav: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
  { to: '/compras', label: 'Compras', icon: ShoppingBasket },
  { to: '/familia', label: 'Familia', icon: Users },
  {
    to: '/mas',
    label: 'Más',
    icon: Ellipsis,
    match: ['/mas', '/mascotas', '/tareas', '/calendario', '/ajustes', '/notificaciones'],
  },
]

export const desktopNav: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/finanzas', label: 'Finanzas', icon: Wallet },
  { to: '/compras', label: 'Compras', icon: ShoppingBasket },
  { to: '/familia', label: 'Familia', icon: Users },
  { to: '/mascotas', label: 'Mascotas', icon: PawPrint },
  { to: '/tareas', label: 'Tareas', icon: ListTodo },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

export function isActive(pathname: string, item: NavItem) {
  if (item.to === '/') return pathname === '/'
  if (item.match) return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}
