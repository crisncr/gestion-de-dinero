import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppState as RnAppState } from 'react-native'
import {
  api,
  applySnapshot,
  getToken,
  isCloudEnabled,
  setToken,
  type AuthSnapshot,
  type CloudSnapshot,
} from '../api/client'
import { careKinds, shoppingExpenseCategory } from '../data/catalog'
import { isCurrency } from '../data/currencies'
import { hashPassword } from '../lib/crypto'
import { isAdultBirthDate, UNDERAGE_MESSAGE } from '../lib/age'
import { daysBetween, monthKey, todayISO } from '../lib/format'
import { joinPetNames, latestSpeciesSupply, petIdsOf } from '../lib/pets'
import { collectNotifications, collectReminders } from '../lib/reminders'
import { inviteCode, uid } from '../lib/ids'
import type {
  AppState,
  CalendarEvent,
  EventKind,
  Household,
  Member,
  Pet,
  PetCare,
  PetCareInput,
  Priority,
  Role,
  ShoppingItem,
  TaskItem,
  Transaction,
  TxType,
  UpcomingItem,
  User,
} from '../types'
import { emptyState, loadState, saveState, wipeLocalAccounts } from './persist'

type RegisterInput = {
  name: string
  email: string
  password: string
  householdName: string
  monthlyBudget: number
  currency: string
  acceptedTerms: boolean
  termsVersion: string
  inviteCode?: string
  birthDate: string
}

type TransactionInput = {
  type: TxType
  amount: number
  category: string
  description: string
  date: string
  memberId?: string | null
}

type ShoppingInput = {
  name: string
  category: string
  quantity: number
  price: number
  createdAt?: string
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
  monthSalary: number
  monthContributions: number
  pendingShopping: number
  shoppingTotal: number
  upcoming: UpcomingItem[]
  notifications: UpcomingItem[]
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
  cloud: boolean
  stats: HouseholdStats
  register: (input: RegisterInput) => Promise<{ needsVerification?: boolean; email?: string }>
  login: (
    email: string,
    password: string,
    consent?: { acceptedTerms: boolean; termsVersion: string },
  ) => Promise<{ needsVerification?: boolean; needsConsent?: boolean; needsBirthDate?: boolean; email?: string }>
  confirmBirthDate: (
    email: string,
    password: string,
    birthDate: string,
    consent?: { acceptedTerms: boolean; termsVersion: string },
  ) => Promise<{ needsVerification?: boolean; needsConsent?: boolean; needsBirthDate?: boolean; email?: string }>
  verifyEmail: (email: string, code: string) => Promise<void>
  confirmCode: (email: string, code: string) => Promise<AuthSnapshot>
  enterSession: (snap: AuthSnapshot) => Promise<void>
  resendCode: (email: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ maskedEmail: string }>
  checkResetCode: (email: string, code: string) => Promise<void>
  finishPasswordReset: (email: string, code: string, password: string) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  updateProfile: (name: string) => void
  changePassword: (current: string, next: string) => Promise<void>
  updateHousehold: (patch: Partial<Pick<Household, 'name' | 'monthlyBudget' | 'currency'>>) => void
  setActiveHousehold: (id: string) => void | Promise<unknown>
  joinHousehold: (code: string) => void | Promise<unknown>
  refresh: () => Promise<void>
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
  clearPurchased: (itemIds?: string[]) => void
  addPet: (input: PetInput) => {
    id: string
    inherited: Array<'comida' | 'arena'>
    synced: Promise<void>
  }
  resolvePetId: (id: string) => string
  updatePet: (id: string, input: PetInput) => void | Promise<unknown>
  removePet: (id: string) => void
  removePets: (ids: string[]) => void
  addPetWeight: (petId: string, weight: number, date: string) => void
  addPetCare: (petId: string, input: PetCareInput) => void
  updatePetCare: (careId: string, input: PetCareInput) => void
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
  return collectReminders(state, householdId)
}

function buildNotifications(state: AppState, householdId: string): UpcomingItem[] {
  return collectNotifications(state, householdId)
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
      monthSalary: 0,
      monthContributions: 0,
      pendingShopping: 0,
      shoppingTotal: 0,
      upcoming: [],
      notifications: [],
    }
  }

  const month = monthKey()
  const txs = state.transactions.filter((t) => t.householdId === household.id)
  const monthTxs = txs.filter((t) => t.date.startsWith(month))
  const monthIncome = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const allIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const allExpenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const remaining = monthIncome - monthExpenses
  const usedPct = monthIncome > 0 ? (monthExpenses / monthIncome) * 100 : monthExpenses > 0 ? 100 : 0
  const monthSalary = monthTxs.filter((t) => t.type === 'income' && t.category === 'sueldo').reduce((s, t) => s + t.amount, 0)
  const monthContributions = monthTxs
    .filter((t) => t.type === 'income' && t.category === 'aporte')
    .reduce((s, t) => s + t.amount, 0)
  const shopping = state.shopping.filter((s) => s.householdId === household.id)
  const pending = shopping.filter((s) => !s.purchased && s.createdAt.slice(0, 7) === month)

  return {
    monthIncome,
    monthExpenses,
    remaining,
    usedPct,
    savings: allIncome - monthIncome - (allExpenses - monthExpenses),
    monthSalary,
    monthContributions,
    pendingShopping: pending.length,
    shoppingTotal: pending.reduce((s, i) => s + i.price * i.quantity, 0),
    upcoming: buildUpcoming(state, household.id),
    notifications: buildNotifications(state, household.id),
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState)
  const [ready, setReady] = useState(false)
  const writeSeq = useRef(0)
  const writesOpen = useRef(0)
  const revisionRef = useRef(-1)
  const activeRef = useRef<string | null>(null)
  const photoCache = useRef<Record<string, string>>({})
  const hydrating = useRef(new Set<string>())
  const hydrateQueue = useRef(Promise.resolve())
  const petReady = useRef<Record<string, Promise<string>>>({})
  const discardedPets = useRef(new Set<string>())
  const idAlias = useRef<Record<string, string>>({})

  const resolveId = (id: string) => {
    let current = id
    const seen = new Set<string>()
    while (idAlias.current[current] && !seen.has(current)) {
      seen.add(current)
      current = idAlias.current[current]
    }
    return current
  }

  const applyRemote = (snap: CloudSnapshot) => {
    if (typeof snap.revision === 'number') revisionRef.current = snap.revision
    activeRef.current = snap.activeHouseholdId
    const pets = (snap.pets ?? []).map((pet) => {
      if (pet.photo) photoCache.current[pet.id] = pet.photo
      return { ...pet, photo: pet.photo || photoCache.current[pet.id] || null }
    })
    setState(applySnapshot({ ...snap, pets }))
    const needed = (snap.pets ?? []).filter(
      (pet) => pet.hasPhoto && !photoCache.current[pet.id] && !hydrating.current.has(pet.id),
    )
    for (const pet of needed) {
      hydrating.current.add(pet.id)
      hydrateQueue.current = hydrateQueue.current
        .then(async () => {
          try {
            const row = await api<{ photo: string | null }>(`/pets/${pet.id}/photo`)
            if (!row.photo) return
            photoCache.current[pet.id] = row.photo
            setState((prev) => ({
              ...prev,
              pets: prev.pets.map((item) => (item.id === pet.id ? { ...item, photo: row.photo } : item)),
            }))
          } catch {
            /* la ficha puede vivir sin foto */
          } finally {
            hydrating.current.delete(pet.id)
          }
        })
        .catch(() => undefined)
    }
  }

  useEffect(() => {
    loadState().then(async () => {
      if (isCloudEnabled()) {
        await wipeLocalAccounts()
        const token = await getToken()
        if (token) {
          try {
            const snap = await api<AuthSnapshot>('/auth/me')
            applyRemote(snap)
            setReady(true)
            return
          } catch {
            await setToken(null)
          }
        }
        setState(emptyState())
        setReady(true)
        return
      }
      const next = await loadState()
      setState(next)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready || isCloudEnabled()) return
    void saveState(state)
  }, [ready, state])

  useEffect(() => {
    if (!ready || !isCloudEnabled() || !state.sessionUserId) return
    let cancelled = false
    let inFlight = false

    const tick = async () => {
      if (cancelled || inFlight || writesOpen.current > 0) return
      inFlight = true
      const token = writeSeq.current
      try {
        const cursor = await api<{ revision: number; activeHouseholdId: string | null }>('/sync/revision')
        if (cancelled || token !== writeSeq.current || writesOpen.current > 0) return
        if (cursor.revision === revisionRef.current && cursor.activeHouseholdId === activeRef.current) return
        const snap = await api<CloudSnapshot>('/sync')
        if (cancelled || token !== writeSeq.current || writesOpen.current > 0) return
        applyRemote(snap)
      } catch {
        /* el servidor puede estar apagado un momento */
      } finally {
        inFlight = false
      }
    }

    const interval = setInterval(() => {
      void tick()
    }, 2000)
    const sub = RnAppState.addEventListener('change', (status) => {
      if (status === 'active') void tick()
    })
    void tick()
    return () => {
      cancelled = true
      clearInterval(interval)
      sub.remove()
    }
  }, [ready, state.sessionUserId])

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

    const cloud = isCloudEnabled()
    const beginWrite = () => {
      writesOpen.current += 1
      writeSeq.current += 1
      return writeSeq.current
    }
    const endWrite = () => {
      writesOpen.current = Math.max(0, writesOpen.current - 1)
    }
    const saveCloud = async (path: string, options?: { method?: string; body?: unknown }) => {
      const ticket = beginWrite()
      try {
        const snap = await api<CloudSnapshot & { id?: string }>(path, options)
        if (ticket === writeSeq.current) applyRemote(snap)
        return snap
      } finally {
        endWrite()
      }
    }
    const waitPet = (id: string) => petReady.current[id] ?? Promise.resolve(resolveId(id))
    const refresh = async () => {
      if (!cloud || !state.sessionUserId || writesOpen.current > 0) return
      const token = writeSeq.current
      const snap = await api<CloudSnapshot>('/sync')
      if (token !== writeSeq.current || writesOpen.current > 0) return
      applyRemote(snap)
    }

    const dropPetsLocal = (ids: string[]) => {
      const idSet = new Set(ids)
      for (const id of ids) delete photoCache.current[id]
      patch((prev) => ({
        ...prev,
        pets: prev.pets.filter((p) => !idSet.has(p.id)),
        petWeights: prev.petWeights.filter((w) => !idSet.has(w.petId)),
        petCares: prev.petCares.flatMap((care) => {
          const nextIds = petIdsOf(care).filter((petId) => !idSet.has(petId))
          if (nextIds.length === 0) return []
          return [{ ...care, petId: nextIds[0], petIds: nextIds }]
        }),
      }))
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
      cloud,
      refresh,
      stats: computeStats(state),
      register: async (input) => {
        if (cloud) {
          const snap = await api<AuthSnapshot & { needsVerification?: boolean; email?: string }>('/auth/register', {
            method: 'POST',
            token: null,
            body: {
              name: input.name,
              email: input.email,
              password: input.password,
              householdName: input.householdName,
              monthlyBudget: input.monthlyBudget,
              currency: input.currency,
              acceptedTerms: input.acceptedTerms,
              termsVersion: input.termsVersion,
              inviteCode: input.inviteCode,
              birthDate: input.birthDate,
            },
          })
          if (snap.needsVerification) {
            return { needsVerification: true, email: snap.email || input.email }
          }
          await setToken(snap.token)
          applyRemote(snap)
          return {}
        }
        const invitedCode = input.inviteCode?.trim().toUpperCase()
        const invited = invitedCode
          ? state.households.find((row) => row.inviteCode === invitedCode)
          : undefined
        if (invitedCode && !invited) throw new Error('El código de invitación no es válido')
        if (!isAdultBirthDate(input.birthDate)) throw new Error(UNDERAGE_MESSAGE)
        const email = normalizeEmail(input.email)
        if (state.users.some((u) => u.email === email)) {
          throw new Error('Ese correo ya tiene una cuenta')
        }
        const user: User = {
          id: uid(),
          name: input.name.trim(),
          email,
          passwordHash: await hashPassword(input.password),
          birthDate: input.birthDate,
          createdAt: new Date().toISOString(),
        }
        const householdId = uid()
        const newHousehold: Household = {
          id: householdId,
          name: input.householdName.trim(),
          monthlyBudget: Math.max(0, input.monthlyBudget),
          currency: isCurrency(input.currency) ? input.currency : 'CLP',
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
        const invitedMember: Member | null = invited
          ? {
              id: uid(),
              householdId: invited.id,
              userId: user.id,
              name: user.name,
              email: user.email,
              role: 'member',
              createdAt: new Date().toISOString(),
            }
          : null
        patch((prev) => ({
          ...prev,
          users: [...prev.users, user],
          households: [...prev.households, newHousehold],
          members: [...prev.members, member, ...(invitedMember ? [invitedMember] : [])],
          sessionUserId: user.id,
          activeHouseholdId: invited?.id ?? householdId,
        }))
        return {}
      },
      login: async (email, password, consent) => {
        if (cloud) {
          const snap = await api<
            AuthSnapshot & {
              needsVerification?: boolean
              needsConsent?: boolean
              needsBirthDate?: boolean
              email?: string
            }
          >('/auth/login', {
            method: 'POST',
            token: null,
            body: {
              email,
              password,
              acceptedTerms: consent?.acceptedTerms,
              termsVersion: consent?.termsVersion,
            },
          })
          if (snap.needsBirthDate) {
            return { needsBirthDate: true, email: snap.email || email }
          }
          if (snap.needsConsent) {
            return { needsConsent: true, email: snap.email || email }
          }
          if (snap.needsVerification) {
            return { needsVerification: true, email: snap.email || email }
          }
          await setToken(snap.token)
          applyRemote(snap)
          return {}
        }
        const user = state.users.find((u) => u.email === normalizeEmail(email))
        if (!user || user.passwordHash !== (await hashPassword(password))) {
          throw new Error('Correo o contraseña incorrectos')
        }
        if (!user.birthDate) {
          return { needsBirthDate: true, email: user.email }
        }
        const first = userHouseholds(state, user.id)[0]
        patch((prev) => ({
          ...prev,
          sessionUserId: user.id,
          activeHouseholdId: first?.id ?? null,
        }))
        return {}
      },
      confirmBirthDate: async (email, password, birthDate, consent) => {
        if (cloud) {
          const snap = await api<
            AuthSnapshot & { needsVerification?: boolean; needsConsent?: boolean; email?: string }
          >('/auth/birth-date', {
            method: 'POST',
            token: null,
            body: {
              email,
              password,
              birthDate,
              acceptedTerms: consent?.acceptedTerms,
              termsVersion: consent?.termsVersion,
            },
          })
          if (snap.needsConsent) return { needsConsent: true, email: snap.email || email }
          if (snap.needsVerification) return { needsVerification: true, email: snap.email || email }
          await setToken(snap.token)
          applyRemote(snap)
          return {}
        }
        const user = state.users.find((u) => u.email === normalizeEmail(email))
        if (!user || user.passwordHash !== (await hashPassword(password))) {
          throw new Error('Correo o contraseña incorrectos')
        }
        if (!isAdultBirthDate(birthDate)) {
          patch((prev) => {
            const owned = prev.households.filter((row) => row.ownerId === user.id).map((row) => row.id)
            const drop = new Set(
              owned.filter(
                (id) => !prev.members.some((member) => member.householdId === id && member.userId && member.userId !== user.id),
              ),
            )
            const keptPetIds = new Set(prev.pets.filter((pet) => !drop.has(pet.householdId)).map((pet) => pet.id))
            return {
              ...prev,
              users: prev.users.filter((row) => row.id !== user.id),
              households: prev.households.filter((row) => !drop.has(row.id)),
              members: prev.members.filter((row) => row.userId !== user.id && !drop.has(row.householdId)),
              transactions: prev.transactions.filter((row) => !drop.has(row.householdId)),
              shopping: prev.shopping.filter((row) => !drop.has(row.householdId)),
              pets: prev.pets.filter((row) => keptPetIds.has(row.id)),
              petWeights: prev.petWeights.filter((row) => keptPetIds.has(row.petId)),
              petCares: prev.petCares.filter((row) => keptPetIds.has(row.petId)),
              tasks: prev.tasks.filter((row) => !drop.has(row.householdId)),
              events: prev.events.filter((row) => !drop.has(row.householdId)),
              sessionUserId: prev.sessionUserId === user.id ? null : prev.sessionUserId,
              activeHouseholdId:
                prev.activeHouseholdId && drop.has(prev.activeHouseholdId) ? null : prev.activeHouseholdId,
            }
          })
          throw new Error('Casa360 es solo para mayores de 18 años. Eliminamos esta cuenta.')
        }
        const first = userHouseholds(state, user.id)[0]
        patch((prev) => ({
          ...prev,
          users: prev.users.map((row) => (row.id === user.id ? { ...row, birthDate } : row)),
          sessionUserId: user.id,
          activeHouseholdId: first?.id ?? null,
        }))
        return {}
      },
      verifyEmail: async (email, code) => {
        const snap = await api<AuthSnapshot>('/auth/verify', {
          method: 'POST',
          token: null,
          body: { email, code },
        })
        await setToken(snap.token)
        applyRemote(snap)
      },
      confirmCode: async (email, code) => {
        return api<AuthSnapshot>('/auth/verify', {
          method: 'POST',
          token: null,
          body: { email, code },
        })
      },
      enterSession: async (snap) => {
        await setToken(snap.token)
        applyRemote(snap)
      },
      resendCode: async (email) => {
        await api('/auth/resend', { method: 'POST', token: null, body: { email } })
      },
      requestPasswordReset: async (email) => {
        if (cloud) {
          return api<{ maskedEmail: string }>('/auth/recover/start', {
            method: 'POST',
            token: null,
            body: { email },
          })
        }
        throw new Error('La recuperación por correo funciona con el servidor encendido')
      },
      checkResetCode: async (email, code) => {
        await api('/auth/recover/check', { method: 'POST', token: null, body: { email, code } })
      },
      finishPasswordReset: async (email, code, password) => {
        await api('/auth/recover/finish', {
          method: 'POST',
          token: null,
          body: { email, code, password },
        })
      },
      logout: async () => {
        if (cloud) {
          try {
            await api('/auth/logout', { method: 'POST', body: {} })
          } catch {
            /* si no hay red, igual se cierra en este teléfono */
          }
        }
        await setToken(null)
        await wipeLocalAccounts()
        setState(emptyState())
      },
      deleteAccount: async () => {
        if (cloud) {
          await api('/auth/account', { method: 'DELETE' })
        }
        await setToken(null)
        await wipeLocalAccounts()
        setState(emptyState())
      },
      updateProfile: (name) => {
        if (cloud) {
          void saveCloud('/auth/profile', { method: 'PATCH', body: { name } })
          return
        }
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
        if (next.length < 8) throw new Error('Mínimo 8 caracteres')
        if (cloud) {
          const result = await api<{ token?: string }>('/auth/change-password', {
            method: 'POST',
            body: { current, next },
          })
          if (result.token) await setToken(result.token)
          return
        }
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
        if (cloud) {
          void saveCloud('/households', { method: 'PATCH', body: next })
          return
        }
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
                  currency:
                    next.currency && isCurrency(next.currency) ? next.currency : h.currency,
                }
              : h,
          ),
        }))
      },
      setActiveHousehold: (id) => {
        if (cloud) {
          return saveCloud('/households/active', { method: 'POST', body: { id } })
        }
        const user = requireUser(state)
        const allowed = userHouseholds(state, user.id).some((h) => h.id === id)
        if (!allowed) throw new Error('No perteneces a ese hogar')
        patch((prev) => ({ ...prev, activeHouseholdId: id }))
      },
      joinHousehold: (code) => {
        if (cloud) {
          return saveCloud('/households/join', { method: 'POST', body: { code } })
        }
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
        if (cloud) {
          void saveCloud('/members', { method: 'POST', body: { name, email, role } })
          return
        }
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
        if (cloud) {
          void saveCloud(`/members/${id}`, { method: 'PATCH', body: next })
          return
        }
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
        if (cloud) {
          void saveCloud(`/members/${id}`, { method: 'DELETE' })
          return
        }
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
        const contributor =
          input.memberId && state.members.some((m) => m.id === input.memberId && m.householdId === household.id)
            ? input.memberId
            : membership.id
        const row: Transaction = {
          id: uid(),
          householdId: household.id,
          memberId: contributor,
          type: input.type,
          amount: Math.abs(input.amount),
          category: input.category,
          description: input.description.trim(),
          date: input.date,
          createdAt: new Date().toISOString(),
        }
        patch((prev) => ({ ...prev, transactions: [row, ...prev.transactions] }))
        if (cloud) {
          void saveCloud('/transactions', { method: 'POST', body: { ...input, id: row.id } }).then((snap) => {
            if (snap.id) idAlias.current[row.id] = snap.id
          })
        }
      },
      updateTransaction: (id, input) => {
        const { household } = requireMembership(state)
        const real = resolveId(id)
        patch((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            (t.id === id || t.id === real) && t.householdId === household.id
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
        if (cloud) void saveCloud(`/transactions/${real}`, { method: 'PATCH', body: input })
      },
      removeTransaction: (id) => {
        const { household } = requireMembership(state)
        const real = resolveId(id)
        patch((prev) => ({
          ...prev,
          transactions: prev.transactions.filter(
            (t) => !((t.id === id || t.id === real) && t.householdId === household.id),
          ),
        }))
        if (cloud) void saveCloud(`/transactions/${real}`, { method: 'DELETE' })
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
          transactionId: null,
          createdAt: input.createdAt || new Date().toISOString(),
        }
        patch((prev) => ({ ...prev, shopping: [row, ...prev.shopping] }))
        if (cloud) {
          void saveCloud('/shopping', { method: 'POST', body: { ...input, id: row.id } }).then((snap) => {
            if (snap.id) idAlias.current[row.id] = snap.id
          })
        }
      },
      updateShopping: (id, input) => {
        const { household } = requireMembership(state)
        const real = resolveId(id)
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.map((s) =>
            (s.id === id || s.id === real) && s.householdId === household.id
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
        if (cloud) void saveCloud(`/shopping/${real}`, { method: 'PATCH', body: input })
      },
      toggleShopping: (id) => {
        const real = resolveId(id)
        if (cloud) {
          const { household, membership } = requireMembership(state)
          const item = state.shopping.find(
            (s) => (s.id === id || s.id === real) && s.householdId === household.id,
          )
          if (!item) return
          if (!item.purchased) {
            const total = item.price * item.quantity
            const txId = total > 0 ? uid() : null
            const boughtOn = item.createdAt.slice(0, 10)
            patch((prev) => ({
              ...prev,
              shopping: prev.shopping.map((s) =>
                s.id === item.id ? { ...s, purchased: true, transactionId: txId } : s,
              ),
              transactions: txId
                ? [
                    {
                      id: txId,
                      householdId: household.id,
                      memberId: membership.id,
                      type: 'expense' as const,
                      amount: total,
                      category: shoppingExpenseCategory(item.category),
                      description: item.name,
                      date: boughtOn,
                      createdAt: new Date().toISOString(),
                    },
                    ...prev.transactions,
                  ]
                : prev.transactions,
            }))
          } else {
            const txId = item.transactionId
            patch((prev) => ({
              ...prev,
              shopping: prev.shopping.map((s) =>
                s.id === item.id ? { ...s, purchased: false, transactionId: null } : s,
              ),
              transactions: txId ? prev.transactions.filter((t) => t.id !== txId) : prev.transactions,
            }))
          }
          void saveCloud(`/shopping/${real}/toggle`, { method: 'POST', body: {} })
          return
        }
        const { household, membership } = requireMembership(state)
        const item = state.shopping.find((s) => s.id === id && s.householdId === household.id)
        if (!item) return
        if (!item.purchased) {
          const total = item.price * item.quantity
          const txId = total > 0 ? uid() : null
          const boughtOn = item.createdAt.slice(0, 10)
          patch((prev) => ({
            ...prev,
            shopping: prev.shopping.map((s) =>
              s.id === id && s.householdId === household.id
                ? { ...s, purchased: true, transactionId: txId }
                : s,
            ),
            transactions: txId
              ? [
                  {
                    id: txId,
                    householdId: household.id,
                    memberId: membership.id,
                    type: 'expense' as const,
                    amount: total,
                    category: shoppingExpenseCategory(item.category),
                    description: item.name,
                    date: boughtOn,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev.transactions,
                ]
              : prev.transactions,
          }))
          return
        }
        const txId = item.transactionId
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.map((s) =>
            s.id === id && s.householdId === household.id
              ? { ...s, purchased: false, transactionId: null }
              : s,
          ),
          transactions: txId ? prev.transactions.filter((t) => t.id !== txId) : prev.transactions,
        }))
      },
      removeShopping: (id) => {
        const { household } = requireMembership(state)
        const real = resolveId(id)
        const item = state.shopping.find(
          (s) => (s.id === id || s.id === real) && s.householdId === household.id,
        )
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.filter((s) => s.id !== id && s.id !== real),
          transactions: item?.transactionId
            ? prev.transactions.filter((t) => t.id !== item.transactionId)
            : prev.transactions,
        }))
        if (cloud) void saveCloud(`/shopping/${real}`, { method: 'DELETE' })
      },
      clearPurchased: (itemIds) => {
        const { household } = requireMembership(state)
        const wanted = itemIds ? new Set(itemIds) : null
        const spent = state.shopping.filter(
          (s) => s.householdId === household.id && s.purchased && (!wanted || wanted.has(s.id)),
        )
        const txIds = new Set(spent.map((s) => s.transactionId).filter((value): value is string => Boolean(value)))
        patch((prev) => ({
          ...prev,
          shopping: prev.shopping.filter(
            (s) => !(s.householdId === household.id && s.purchased && (!wanted || wanted.has(s.id))),
          ),
          transactions: prev.transactions.filter((t) => !txIds.has(t.id)),
        }))
        if (cloud) {
          void saveCloud('/shopping/clear-purchased', {
            method: 'POST',
            body: { itemIds: spent.map((item) => resolveId(item.id)) },
          })
        }
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
        const householdPets = state.pets.filter((p) => p.householdId === household.id)
        const food = latestSpeciesSupply(state.petCares, householdPets, input.species, 'comida')
        const litter = latestSpeciesSupply(state.petCares, householdPets, input.species, 'arena')
        const inheritIds = new Set([food?.id, litter?.id].filter((value): value is string => Boolean(value)))
        const inherited: Array<'comida' | 'arena'> = []
        if (food) inherited.push('comida')
        if (litter) inherited.push('arena')
        const weightRow =
          input.weight > 0 ? { id: uid(), petId: id, weight: input.weight, date: todayISO() } : null
        if (pet.photo) photoCache.current[id] = pet.photo
        patch((prev) => ({
          ...prev,
          pets: [pet, ...prev.pets],
          petWeights: weightRow ? [...prev.petWeights, weightRow] : prev.petWeights,
          petCares: prev.petCares.map((care) =>
            inheritIds.has(care.id)
              ? { ...care, petIds: [...new Set([...petIdsOf(care), id])] }
              : care,
          ),
        }))
        const rollback = () => {
          patch((prev) => ({
            ...prev,
            pets: prev.pets.filter((row) => row.id !== id),
            petWeights: prev.petWeights.filter((row) => row.petId !== id),
            petCares: prev.petCares.map((care) =>
              inheritIds.has(care.id)
                ? { ...care, petIds: petIdsOf(care).filter((petId) => petId !== id) }
                : care,
            ),
          }))
        }
        discardedPets.current.delete(id)
        const synced = cloud
          ? (async () => {
              const ticket = beginWrite()
              try {
                const snap = await api<CloudSnapshot & { id?: string }>('/pets', {
                  method: 'POST',
                  body: { ...input, id },
                })
                if (snap.id) idAlias.current[id] = snap.id
                if (pet.photo) photoCache.current[snap.id ?? id] = pet.photo
                if (discardedPets.current.has(id) || discardedPets.current.has(snap.id ?? id)) {
                  await api('/pets/delete', { method: 'POST', body: { ids: [snap.id ?? id] } })
                  return
                }
                if (ticket === writeSeq.current) applyRemote(snap)
              } catch (error) {
                rollback()
                throw error
              } finally {
                endWrite()
              }
            })()
          : Promise.resolve()
        petReady.current[id] = synced.then(() => resolveId(id))
        return { id, inherited, synced }
      },
      resolvePetId: (id) => resolveId(id),
      updatePet: (id, input) => {
        if (input.photo) {
          photoCache.current[id] = input.photo
          photoCache.current[resolveId(id)] = input.photo
        }
        const { household } = requireMembership(state)
        const real = resolveId(id)
        patch((prev) => ({
          ...prev,
          pets: prev.pets.map((p) =>
            (p.id === id || p.id === real) && p.householdId === household.id
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
        if (cloud) {
          return waitPet(id).then((petId) => saveCloud(`/pets/${petId}`, { method: 'PATCH', body: input }))
        }
      },
      removePet: (id) => {
        const real = resolveId(id)
        discardedPets.current.add(id)
        discardedPets.current.add(real)
        dropPetsLocal([id, real])
        if (cloud) {
          void waitPet(id).then((petId) => saveCloud('/pets/delete', { method: 'POST', body: { ids: [petId] } }))
        }
      },
      removePets: (ids) => {
        const unique = [...new Set(ids.filter(Boolean).map((item) => resolveId(item)))]
        if (!unique.length) return
        for (const item of unique) discardedPets.current.add(item)
        dropPetsLocal(unique)
        if (cloud) {
          void Promise.all(unique.map((item) => waitPet(item))).then((petIds) =>
            saveCloud('/pets/delete', { method: 'POST', body: { ids: petIds } }),
          )
        }
      },
      addPetWeight: (petId, weight, date) => {
        const { household } = requireMembership(state)
        const real = resolveId(petId)
        const pet = state.pets.find((p) => (p.id === petId || p.id === real) && p.householdId === household.id)
        if (!pet) throw new Error('Mascota no encontrada')
        patch((prev) => ({
          ...prev,
          pets: prev.pets.map((p) => (p.id === pet.id ? { ...p, weight } : p)),
          petWeights: [...prev.petWeights, { id: uid(), petId: pet.id, weight, date }],
        }))
        if (cloud) {
          void waitPet(petId).then((id) => saveCloud(`/pets/${id}/weights`, { method: 'POST', body: { weight, date } }))
        }
      },
      addPetCare: (petId, input) => {
        const { household, membership } = requireMembership(state)
        const householdPets = state.pets.filter((p) => p.householdId === household.id)
        const selected = [...new Set(input.petIds?.length ? input.petIds : [petId])].filter((id) =>
          householdPets.some((p) => p.id === id),
        )
        if (selected.length === 0) throw new Error('Elige al menos una mascota')
        const amount = input.amount && input.amount > 0 ? input.amount : null
        const nextDate = input.nextDate || null
        const paidOn = (input.paidOn || input.date).slice(0, 10)
        const note = input.note.trim()
        const names = joinPetNames(householdPets, selected)
        const kindLabel = careKinds.find((item) => item.id === input.kind)?.label ?? 'Cuidado'
        const description = note
          ? selected.length > 1
            ? `${note} · para ${names}`
            : note
          : `${kindLabel} para ${names}`
        const txId = amount ? uid() : null
        const care: PetCare = {
          id: uid(),
          petId: selected[0],
          petIds: selected,
          kind: input.kind,
          note,
          date: input.date,
          amount,
          nextDate,
          transactionId: txId,
        }
        patch((prev) => ({
          ...prev,
          petCares: [care, ...prev.petCares],
          pets:
            input.kind === 'vacuna' && nextDate
              ? prev.pets.map((p) => (selected.includes(p.id) ? { ...p, nextVaccine: nextDate } : p))
              : prev.pets,
          transactions: txId && amount
            ? [
                {
                  id: txId,
                  householdId: household.id,
                  memberId: membership.id,
                  type: 'expense' as const,
                  amount,
                  category: 'mascotas',
                  description,
                  date: paidOn,
                  createdAt: new Date().toISOString(),
                },
                ...prev.transactions,
              ]
            : prev.transactions,
        }))
        if (cloud) {
          void waitPet(petId).then((id) =>
            saveCloud(`/pets/${id}/cares`, { method: 'POST', body: { ...input, petIds: selected } }),
          )
        }
      },
      updatePetCare: (careId, input) => {
        if (cloud) {
          void saveCloud(`/cares/${careId}`, { method: 'PATCH', body: input })
          return
        }
        const { household, membership } = requireMembership(state)
        const current = state.petCares.find((care) => care.id === careId)
        if (!current) throw new Error('Compra no encontrada')
        const householdPets = state.pets.filter((p) => p.householdId === household.id)
        const selected = [...new Set(input.petIds?.length ? input.petIds : [current.petId])].filter((id) =>
          householdPets.some((p) => p.id === id),
        )
        if (selected.length === 0) throw new Error('Elige al menos una mascota')
        const amount = input.amount && input.amount > 0 ? input.amount : null
        const nextDate = input.nextDate || null
        const paidOn = (input.paidOn || input.date).slice(0, 10)
        const note = input.note.trim()
        const names = joinPetNames(householdPets, selected)
        const kindLabel = careKinds.find((item) => item.id === input.kind)?.label ?? 'Cuidado'
        const description = note
          ? selected.length > 1
            ? `${note} · para ${names}`
            : note
          : `${kindLabel} para ${names}`
        const txId = amount ? current.transactionId || uid() : current.transactionId
        patch((prev) => {
          const withoutOldTx = current.transactionId
            ? prev.transactions.filter((t) => t.id !== current.transactionId)
            : prev.transactions
          const nextTx =
            amount && txId
              ? [
                  {
                    id: txId,
                    householdId: household.id,
                    memberId: membership.id,
                    type: 'expense' as const,
                    amount,
                    category: 'mascotas',
                    description,
                    date: paidOn,
                    createdAt:
                      prev.transactions.find((t) => t.id === current.transactionId)?.createdAt ??
                      new Date().toISOString(),
                  },
                  ...withoutOldTx,
                ]
              : withoutOldTx
          return {
            ...prev,
            petCares: prev.petCares.map((care) =>
              care.id === careId
                ? {
                    ...care,
                    petId: selected[0],
                    petIds: selected,
                    kind: input.kind,
                    note,
                    date: input.date,
                    amount,
                    nextDate,
                    transactionId: amount ? txId : null,
                  }
                : care,
            ),
            pets:
              input.kind === 'vacuna' && nextDate
                ? prev.pets.map((p) => (selected.includes(p.id) ? { ...p, nextVaccine: nextDate } : p))
                : prev.pets,
            transactions: nextTx,
          }
        })
      },
      addTask: (input) => {
        if (cloud) {
          void saveCloud('/tasks', { method: 'POST', body: input })
          return
        }
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
        if (cloud) {
          void saveCloud(`/tasks/${id}`, { method: 'PATCH', body: input })
          return
        }
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
        if (cloud) {
          void saveCloud(`/tasks/${id}/toggle`, { method: 'POST' })
          return
        }
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
        const real = resolveId(id)
        const removed = state.tasks.filter(
          (t) => (t.id === id || t.id === real) && t.householdId === household.id,
        )
        patch((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id && t.id !== real),
        }))
        if (cloud) {
          void saveCloud(`/tasks/${real}`, { method: 'DELETE' }).catch(() => {
            patch((prev) => ({
              ...prev,
              tasks: [...removed, ...prev.tasks.filter((t) => !removed.some((row) => row.id === t.id))],
            }))
          })
        }
      },
      addEvent: (input) => {
        if (cloud) {
          void saveCloud('/events', { method: 'POST', body: input })
          return
        }
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
        if (cloud) {
          void saveCloud(`/events/${id}`, { method: 'PATCH', body: input })
          return
        }
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
        if (cloud) {
          void saveCloud(`/events/${id}`, { method: 'DELETE' })
          return
        }
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
