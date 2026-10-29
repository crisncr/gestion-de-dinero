import { Outlet } from 'react-router-dom'
import { Logo } from '../brand/Logo'

export function AuthShell() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(85,214,160,0.08),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-5 py-10">
        <Logo className="mb-8 justify-center" />
        <Outlet />
      </div>
    </div>
  )
}
