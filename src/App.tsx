import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthShell } from './components/layout/AuthShell'
import { GuestOnly, Protected } from './components/layout/Protected'
import { LoginPage } from './pages/auth/LoginPage'
import { RecoverPage } from './pages/auth/RecoverPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { FamilyPage } from './pages/family/FamilyPage'
import { FinancePage } from './pages/finance/FinancePage'
import { MorePage } from './pages/more/MorePage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { PetDetailPage } from './pages/pets/PetDetailPage'
import { PetsPage } from './pages/pets/PetsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ShoppingPage } from './pages/shopping/ShoppingPage'
import { TasksPage } from './pages/tasks/TasksPage'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route element={<AuthShell />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar" element={<RecoverPage />} />
        </Route>
      </Route>

      <Route element={<Protected />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/finanzas" element={<FinancePage />} />
          <Route path="/compras" element={<ShoppingPage />} />
          <Route path="/familia" element={<FamilyPage />} />
          <Route path="/mascotas" element={<PetsPage />} />
          <Route path="/mascotas/:id" element={<PetDetailPage />} />
          <Route path="/tareas" element={<TasksPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/mas" element={<MorePage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
          <Route path="/notificaciones" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
