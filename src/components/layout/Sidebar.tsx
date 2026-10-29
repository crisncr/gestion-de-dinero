import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useStore } from '../../store/StoreProvider'
import { Logo } from '../brand/Logo'
import { Avatar } from '../ui/Avatar'
import { desktopNav, isActive } from './nav'

export function Sidebar() {
  const { pathname } = useLocation()
  const { currentUser, household } = useStore()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-ink px-4 py-5 lg:flex">
      <Logo className="px-2" />
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {desktopNav.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-lift text-cream' : 'text-mute hover:bg-surface hover:text-cream',
              )}
            >
              <Icon size={18} className={active ? 'text-mint' : ''} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center gap-3">
          <Avatar name={currentUser?.name ?? 'Hogar'} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{currentUser?.name}</p>
            <p className="truncate text-xs text-mute">{household?.name ?? 'Sin hogar'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
