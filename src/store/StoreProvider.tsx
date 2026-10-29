import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hashPassword } from '../lib/crypto'
import { addDays, daysBetween, monthKey, todayISO } from '../lib/format'
import { inviteCode, uid } from '../lib/ids'
import type {
  AppState,
  CalendarEvent,
  EventKind,
  Household,
  Member,
  Pet,
  PetCare,
  PetCareKind,
  Priority,
  Role,
  ShoppingItem,
  TaskItem,
  Transaction,
  TxType,
  UpcomingItem,
  User,
} from '../types'
import { emptyState, loadState, saveState } from './persist'

type RegisterInput = {
  name: string
  email: string
  password: string
  householdName: string
  monthlyBudget: number
}

type TransactionInput = {
  type: TxType
  amount: number
  category: string
  description: string
  date: string
}

type ShoppingInput = {
  name: string
  category: string
  quantity: number
  price: number
}

type PetInput = {
  name: string
  species: string
  weight: number
  photo: string | null
  nextVaccine: string | null
  notes: string
}

type TaskInput = {
  title: string
  assignedMemberId: string | null
  dueDate: string | null
  priority: Priority
}

type EventInput = {
  title: string
  date: string
  kind: EventKind
  note: string
}

export type HouseholdStats = {
  monthIncome: number
  monthExpenses: number
  remaining: number
  usedPct: number
  savings: number
  pendingShopping: number
  shoppingTotal: number
  upcoming: UpcomingItem[]
}

type StoreValue = {
  ready: boolean
  state: AppState
  currentUser: User | null
  household: Household | null
  membership: Member | null
  members: Member[]
  households: Household[]
  canManage: boolean
  stats: HouseholdStats
  register: (input: RegisterInput) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  recoverPassword: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (name: string) => void
  changePassword: (current: string, next: string) => Promise<void>
  updateHousehold: (patch: Partial<Pick<Household, 'name' | 'monthlyBudget'>>) => void
  setActiveHousehold: (id: string) => void
  joinHousehold: (code: string) => void
  addLocalMember: (name: string, email: string, role: Exclude<Role, 'owner'>) => void
  updateMember: (id: string, patch: Partial<Pick<Member, 'name' | 'role'>>) => void
  removeMember: (id: string) => void
  addTransaction: (input: TransactionInput) => void
  updateTransaction: (id: string, input: TransactionInput) => void
  removeTransaction: (id: string) => void
  addShopping: (input: ShoppingInput) => void
  updateShopping: (id: string, input: ShoppingInput) => void
  toggleShopping: (id: string) => void
  removeShopping: (id: string) => void
  clearPurchased: () => void
  addPet: (input: PetInput) => string
  updatePet: (id: string, input: PetInput) => void
  removePet: (id: string) => void
  addPetWeight: (petId: string, weight: number, date: string) => void
  addPetCare: (petId: string, kind: PetCareKind, note: string, date: string) => void
  addTask: (input: TaskInput) => void
  updateTask: (id: string, input: TaskInput) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  addEvent: (input: EventInput) => void
  updateEvent: (id: string, input: EventInput) => void
  removeEvent: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function requireHousehold(state: AppState) {
  const household = state.households.find((h) => h.id === state.activeHouseholdId)
  if (!household) throw new Error('No hay un hogar activo')
  return household
}

function requireUser(state: AppState) {
  const user = state.users.find((u) => u.id === state.sessionUserId)
  if (!user) throw new Error('Debes iniciar sesión')
  return user
}

function requireMembership(state: AppState) {
  const user = requireUser(state)
  const household = requireHousehold(state)
  const membership = state.members.find(
    (m) => m.householdId === household.id && m.userId === user.id,
  )
  if (!membership) throw new Error('No perteneces a este hogar')
  return { user, household, membership }
}

function userHouseholds(state: AppState, userId: string) {
  const ids = new Set(
    state.members.filter((m) => m.userId === userId).map((m) => m.householdId),
  )
  return state.households.filter((h) => ids.has(h.id))
}

function buildUpcoming(state: AppState, householdId: string): UpcomingItem[] {
  const today = todayISO()
  const horizon = addDays(today, 21)
  const members = state.members.filter((m) => m.householdId === householdId)
  const items: UpcomingItem[] = []

  for (const event of state.events.filter((e) => e.householdId === householdId)) {
    if (event.date < today || event.date > horizon) continue
    items.push({
      id: `event-${event.id}`,
      title: event.title,
      date: event.date,
      kind: event.kind,
      meta: event.note || 'Recordatorio',
      href: '/calendario',
    })
  }

  for (const task of state.tasks.filter((t) => t.householdId === householdId && !t.done && t.dueDate)) {
    if (!task.dueDate || task.dueDate > horizon) continue
    const assignee = members.find((m) => m.id === task.assignedMemberId)
    items.push({
      id: `task-${task.id}`,
      title: task.title,
      date: task.dueDate,
      kind: 'task',
      meta: assignee ? `Asignada a ${assignee.name}` : 'Sin asignar',
      href: '/tareas',
    })
  }

  for (const pet of state.pets.filter((p) => p.householdId === householdId && p.nextVaccine)) {
    if (!pet.nextVaccine || pet.nextVaccine > horizon) continue
    items.push({
      id: `pet-${pet.id}`,
      title: `Vacuna de ${pet.name}`,
      date: pet.nextVaccine,
      kind: 'pet',
      meta: pet.species,
      href: `/mascotas/${pet.id}`,
    })
  }

  const pending = state.shopping.filter((s) => s.householdId === householdId && !s.purchased)
  if (pending.length > 0) {
    items.push({
      id: 'shopping-pending',
      title: 'Compras pendientes',
      date: today,
      kind: 'shopping',
      meta: `${pending.length} producto${pending.length === 1 ? '' : 's'}`,
      href: '/compras',
    })
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)).slice(0, 8)
}

function computeStats(state: AppState): HouseholdStats {
  const household = state.households.find((h) => h.id === state.activeHouseholdId)
  if (!household) {
    return {
      monthIncome: 0,
      monthExpenses: 0,
      remaining: 0,
      usedPct: 0,
      savings: 0,
      pendingShopping: 0,
      shoppingTotal: 0,
      upcoming: [],
    }
  }

  const month = monthKey()
  const txs = state.transactions.filter((t) => t.householdId === household.id)
  const monthTxs = txs.filter((t) => t.date.startsWith(month))
  const monthIncome = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const allIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const allExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const remaining = household.monthlyBudget - monthExpenses
  const usedPct = household.monthlyBudget > 0 ? (monthExpenses / household.monthlyBudget) * 100 : 0
  const shopping = state.shopping.filter((s) => s.householdId === household.id)
  const pending = shopping.filter((s) => !s.purchased)

  return {
    monthIncome,
    monthExpenses,
    remaining,
    usedPct,
    savings: allIncome - allExpenses,
    pendingShopping: pending.length,
    shoppingTotal: pending.reduce((s, i) => s + i.price * i.quantity, 0),
    upcoming: buildUpcoming(state, household.id),
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState(loadState())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveState(state)
  }, [ready, state])

  const value = useMemo<StoreValue>(() => {
    const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? null
    const households = currentUser ? userHouseholds(state, currentUser.id) : []
    const household = state.households.find((h) => h.id === state.activeHouseholdId) ?? null
    const membership =
      currentUser && household
        ? (state.members.find((m) => m.householdId === household.id && m.userId === currentUser.id) ?? null)
        : null
    const members = household ? state.members.filter((m) => m.householdId === household.id) : []
    const canManage = membership?.role === 'owner' || membership?.role === 'admin'

    const patch = (fn: (prev: AppState) => AppState) => {
      setState((prev) => fn(prev))
    }

    return {
      ready,
      state,
      currentUser,
      household,
      membership,
      members,
      households,
      canManage,
      stats: computeStats(state),
      register: async (input) => {
        const email = normalizeEmail(input.email)
        if (state.users.some((u) => u.email === email)) {
          throw new Error('Ese correo ya tiene una cuenta')
        }
        const user: User = {
          id: uid(),
          name: input.name.trim(),
          email,
          passwordHash: await hashPassword(input.password),
          createdAt: new Date().toISOString(),
        }
        const householdId = uid()
        const newHousehold: Household = {
          id: householdId,
          name: input.householdName.trim(),
          monthlyBudget: Math.max(0, input.monthlyBudget),
          currency: 'CLP',
          inviteCode: inviteCode(),
          ownerId: user.id,
          createdAt: new Date().toISOString(),
        }
        const member: Member = {
          id: uid(),
          householdId,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: 'owner',
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({
          ...prev,
          users: [...prev.users, user],
          households: [...prev.households, newHousehold],
          members: [...prev.members, member],
          sessionUserId: user.id,
          activeHouseholdId: householdId,
        }))
      },
      login: async (email, password) => {
        const user = state.users.find((u) => u.email === normalizeEmail(email))
        if (!user || user.passwordHash !== (await hashPassword(password))) {
          throw new Error('Correo o contraseña incorrectos')
        }
        const first = userHouseholds(state, user.id)[0]
        patch((prev) => ({
          ...prev,
          sessionUserId: user.id,
          activeHouseholdId: first?.id ?? null,
        }))
      },
      recoverPassword: async (email, password) => {
        const user = state.users.find((u) => u.email === normalizeEmail(email))
        if (!user) throw new Error('No encontramos una cuenta con ese correo')
        const passwordHash = await hashPassword(password)
        patch((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? { ...u, passwordHash } : u)),
        }))
      },
      logout: () => {
        patch((prev) => ({ ...prev, sessionUserId: null, activeHouseholdId: null }))
      },
      updateProfile: (name) => {
        const user = requireUser(state)
        patch((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? { ...u, name: name.trim() } : u)),
          members: prev.members.map((m) =>
            m.userId === user.id ? { ...m, name: name.trim() } : m,
          ),
        }))
      },
      changePassword: async (current, next) => {
        const user = requireUser(state)
        if (user.passwordHash !== (await hashPassword(current))) {
          throw new Error('La contraseña actual no es correcta')
        }
        const passwordHash = await hashPassword(next)
        patch((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? { ...u, passwordHash } : u)),
        }))
      },
      updateHousehold: (next) => {
        const { household: current, membership: me } = requireMembership(state)
        if (me.role === 'member') throw new Error('No tienes permiso para editar el hogar')
        patch((prev) => ({
          ...prev,
          households: prev.households.map((h) =>
            h.id === current.id
              ? {
                  ...h,
                  name: next.name?.trim() || h.name,
                  monthlyBudget:
                    next.monthlyBudget === undefined ? h.monthlyBudget : Math.max(0, next.monthlyBudget),
                }
              : h,
          ),
        }))
      },
      setActiveHousehold: (id) => {
        const user = requireUser(state)
        const allowed = userHouseholds(state, user.id).some((h) => h.id === id)
        if (!allowed) throw new Error('No perteneces a ese hogar')
        patch((prev) => ({ ...prev, activeHouseholdId: id }))
      },
      joinHousehold: (code) => {
        const user = requireUser(state)
        const target = state.households.find((h) => h.inviteCode === code.trim().toUpperCase())
        if (!target) throw new Error('El código de invitación no es válido')
        const already = state.members.some((m) => m.householdId === target.id && m.userId === user.id)
        if (already) throw new Error('Ya formas parte de este hogar')
        const member: Member = {
          id: uid(),
          householdId: target.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: 'member',
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({
          ...prev,
          members: [...prev.members, member],
          activeHouseholdId: target.id,
        }))
      },
      addLocalMember: (name, email, role) => {
        const { household, membership: me } = requireMembership(state)
        if (me.role === 'member') throw new Error('No tienes permiso para invitar')
        const member: Member = {
          id: uid(),
          householdId: household.id,
          userId: null,
          name: name.trim(),
          email: normalizeEmail(email),
          role,
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({ ...prev, members: [...prev.members, member] }))
      },
      updateMember: (id, next) => {
        const { household, membership: me } = requireMembership(state)
        if (me.role === 'member') throw new Error('No tienes permiso para editar integrantes')
        const target = state.members.find((m) => m.id === id && m.householdId === household.id)
        if (!target) throw new Error('Integrante no encontrado')
        if (target.role === 'owner') throw new Error('El titular no se puede modificar')
        patch((prev) => ({
          ...prev,
          members: prev.members.map((m) =>
            m.id === id
              ? {
                  ...m,
                  name: next.name?.trim() || m.name,
                  role: next.role && next.role !== 'owner' ? next.role : m.role,
                }
              : m,
          ),
        }))
      },
      removeMember: (id) => {
        const { household, membership: me } = requireMembership(state)
        if (me.role === 'member') throw new Error('No tienes permiso para quitar integrantes')
        const target = state.members.find((m) => m.id === id && m.householdId === household.id)
        if (!target) throw new Error('Integrante no encontrado')
        if (target.role === 'owner') throw new Error('No puedes quitar al titular')
        patch((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.id !== id),
          tasks: prev.tasks.map((t) =>
            t.assignedMemberId === id ? { ...t, assignedMemberId: null } : t,
          ),
        }))
      },
      addTransaction: (input) => {
        const { household, membership } = requireMembership(state)
        const row: Transaction = {
          id: uid(),
          householdId: household.id,
          memberId: membership.id,
          type: input.type,
          amount: Math.abs(input.amount),
          category: input.category,
          description: input.description.trim(),
          date: input.date,
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({ ...prev, transactions: [row, ...prev.transactions] }))
      },
      updateTransaction: (id, input) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === id && t.householdId === household.id
              ? {
                  ...t,
                  type: input.type,
                  amount: Math.abs(input.amount),
                  category: input.category,
                  description: input.description.trim(),
                  date: input.date,
                }
              : t,
          ),
        }))
      },
      removeTransaction: (id) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => !(t.id === id && t.householdId === household.id)),
        }))
      },
      addShopping: (input) => {
        const { household } = requireMembership(state)
        const row: ShoppingItem = {
          id: uid(),
          householdId: household.id,
          name: input.name.trim(),
          category: input.category,
          quantity: Math.max(1, input.quantity),
          price: Math.max(0, input.price),
          purchased: false,
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({ ...prev, shopping: [row, ...prev.shopping] }))
      },
      updateShopping: (id, input) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.map((s) =>
            s.id === id && s.householdId === household.id
              ? {
                  ...s,
                  name: input.name.trim(),
                  category: input.category,
                  quantity: Math.max(1, input.quantity),
                  price: Math.max(0, input.price),
                }
              : s,
          ),
        }))
      },
      toggleShopping: (id) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.map((s) =>
            s.id === id && s.householdId === household.id ? { ...s, purchased: !s.purchased } : s,
          ),
        }))
      },
      removeShopping: (id) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.filter((s) => !(s.id === id && s.householdId === household.id)),
        }))
      },
      clearPurchased: () => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.filter((s) => !(s.householdId === household.id && s.purchased)),
        }))
      },
      addPet: (input) => {
        const { household } = requireMembership(state)
        const id = uid()
        const pet: Pet = {
          id,
          householdId: household.id,
          name: input.name.trim(),
          species: input.species,
          weight: Math.max(0, input.weight),
          photo: input.photo,
          nextVaccine: input.nextVaccine,
          notes: input.notes.trim(),
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({
          ...prev,
          pets: [pet, ...prev.pets],
          petWeights:
            input.weight > 0
              ? [...prev.petWeights, { id: uid(), petId: id, weight: input.weight, date: todayISO() }]
              : prev.petWeights,
        }))
        return id
      },
      updatePet: (id, input) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          pets: prev.pets.map((p) =>
            p.id === id && p.householdId === household.id
              ? {
                  ...p,
                  name: input.name.trim(),
                  species: input.species,
                  weight: Math.max(0, input.weight),
                  photo: input.photo,
                  nextVaccine: input.nextVaccine,
                  notes: input.notes.trim(),
                }
              : p,
          ),
        }))
      },
      removePet: (id) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          pets: prev.pets.filter((p) => !(p.id === id && p.householdId === household.id)),
          petWeights: prev.petWeights.filter((w) => w.petId !== id),
          petCares: prev.petCares.filter((c) => c.petId !== id),
        }))
      },
      addPetWeight: (petId, weight, date) => {
        const { household } = requireMembership(state)
        const pet = state.pets.find((p) => p.id === petId && p.householdId === household.id)
        if (!pet) throw new Error('Mascota no encontrada')
        patch((prev) => ({
          ...prev,
          pets: prev.pets.map((p) => (p.id === petId ? { ...p, weight } : p)),
          petWeights: [...prev.petWeights, { id: uid(), petId, weight, date }],
        }))
      },
      addPetCare: (petId, kind, note, date) => {
        const { household } = requireMembership(state)
        const pet = state.pets.find((p) => p.id === petId && p.householdId === household.id)
        if (!pet) throw new Error('Mascota no encontrada')
        const care: PetCare = { id: uid(), petId, kind, note: note.trim(), date }
        patch((prev) => ({ ...prev, petCares: [care, ...prev.petCares] }))
      },
      addTask: (input) => {
        const { household } = requireMembership(state)
        const row: TaskItem = {
          id: uid(),
          householdId: household.id,
          title: input.title.trim(),
          assignedMemberId: input.assignedMemberId,
          dueDate: input.dueDate,
          priority: input.priority,
          done: false,
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({ ...prev, tasks: [row, ...prev.tasks] }))
      },
      updateTask: (id, input) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id && t.householdId === household.id
              ? {
                  ...t,
                  title: input.title.trim(),
                  assignedMemberId: input.assignedMemberId,
                  dueDate: input.dueDate,
                  priority: input.priority,
                }
              : t,
          ),
        }))
      },
      toggleTask: (id) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id && t.householdId === household.id ? { ...t, done: !t.done } : t,
          ),
        }))
      },
      removeTask: (id) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => !(t.id === id && t.householdId === household.id)),
        }))
      },
      addEvent: (input) => {
        const { household } = requireMembership(state)
        const row: CalendarEvent = {
          id: uid(),
          householdId: household.id,
          title: input.title.trim(),
          date: input.date,
          kind: input.kind,
          note: input.note.trim(),
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({ ...prev, events: [row, ...prev.events] }))
      },
      updateEvent: (id, input) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === id && e.householdId === household.id
              ? {
                  ...e,
                  title: input.title.trim(),
                  date: input.date,
                  kind: input.kind,
                  note: input.note.trim(),
                }
              : e,
          ),
        }))
      },
      removeEvent: (id) => {
        const { household } = requireMembership(state)
        patch((prev) => ({
          ...prev,
          events: prev.events.filter((e) => !(e.id === id && e.householdId === household.id)),
        }))
      },
    }
  }, [ready, state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}

export function eventTone(date: string) {
  const delta = daysBetween(todayISO(), date)
  if (delta < 0) return 'overdue'
  if (delta <= 2) return 'soon'
  return 'ok'
}
