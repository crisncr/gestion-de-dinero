import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { EventSheet } from '../../features/calendar/EventSheet'
import { TransactionSheet } from '../../features/finance/TransactionSheet'
import type { TxType } from '../../types'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export type AppOutlet = {
  openExpense: (type?: TxType) => void
  openReminder: () => void
}

export function AppShell() {
  const [txOpen, setTxOpen] = useState(false)
  const [txType, setTxType] = useState<TxType>('expense')
  const [eventOpen, setEventOpen] = useState(false)

  const ctx: AppOutlet = {
    openExpense: (type = 'expense') => {
      setTxType(type)
      setTxOpen(true)
    },
    openReminder: () => setEventOpen(true),
  }

  return (
    <div className="min-h-svh bg-ink text-cream">
      <Sidebar />
      <div className="lg:pl-60">
        <TopBar
          onAddExpense={() => {
            setTxType('expense')
            setTxOpen(true)
          }}
          onAddReminder={() => setEventOpen(true)}
        />
        <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] lg:px-8 lg:pt-6 lg:pb-10">
          <Outlet context={ctx} />
        </main>
        <BottomNav />
      </div>
      <TransactionSheet open={txOpen} initialType={txType} onClose={() => setTxOpen(false)} />
      <EventSheet open={eventOpen} onClose={() => setEventOpen(false)} />
    </div>
  )
}
