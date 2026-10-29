import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { isActive, mobileNav } from './nav'

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="grid grid-cols-5">
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item)
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                  active ? 'text-mint' : 'text-mute',
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
