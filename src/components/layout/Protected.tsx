import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../../store/StoreProvider'

export function Protected() {
  const { ready, currentUser } = useStore()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-ink">
        <div className="size-8 animate-pulse rounded-full bg-lift" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function GuestOnly() {
  const { ready, currentUser } = useStore()

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-ink">
        <div className="size-8 animate-pulse rounded-full bg-lift" />
      </div>
    )
  }

  if (currentUser) return <Navigate to="/" replace />
  return <Outlet />
}
