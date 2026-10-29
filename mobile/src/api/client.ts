import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import type { AppState } from '../types'
import { emptyState } from '../store/persist'

const TOKEN_KEY = 'hogar360.token'

type Extra = { apiUrl?: string }

function devMachineHost() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || ''
  const host = hostUri.split(':')[0]?.trim() ?? ''
  if (!host || host === 'localhost' || host === '127.0.0.1') return ''
  return host
}

function isPrivateHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

export function apiUrl() {
  const extra = Constants.expoConfig?.extra as Extra | undefined
  const raw = (process.env.EXPO_PUBLIC_API_URL || extra?.apiUrl || '').replace(/\/$/, '')
  const phoneHost = devMachineHost()
  if (!raw || !phoneHost) return raw
  try {
    const url = new URL(raw)
    if (isPrivateHost(url.hostname) && url.hostname !== phoneHost) {
      url.hostname = phoneHost
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    return raw
  }
  return raw
}

export function isCloudEnabled() {
  return Boolean(apiUrl())
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function setToken(token: string | null) {
  if (!token) {
    await AsyncStorage.removeItem(TOKEN_KEY)
    return
  }
  await AsyncStorage.setItem(TOKEN_KEY, token)
}

export type CloudUser = {
  id: string
  name: string
  email: string
  createdAt: string
}

export type CloudSnapshot = {
  revision?: number
  user: CloudUser
  activeHouseholdId: string | null
  households: AppState['households']
  members: AppState['members']
  transactions: AppState['transactions']
  shopping: AppState['shopping']
  pets: Array<AppState['pets'][number] & { hasPhoto?: boolean }>
  petWeights: AppState['petWeights']
  petCares: AppState['petCares']
  tasks: AppState['tasks']
  events: AppState['events']
}

export type AuthSnapshot = CloudSnapshot & { token: string }

export function applySnapshot(snap: CloudSnapshot): AppState {
  return {
    ...emptyState(),
    users: [
      {
        id: snap.user.id,
        name: snap.user.name,
        email: snap.user.email,
        passwordHash: 'remote',
        createdAt: snap.user.createdAt,
      },
    ],
    sessionUserId: snap.user.id,
    activeHouseholdId: snap.activeHouseholdId,
    households: snap.households ?? [],
    members: snap.members ?? [],
    transactions: snap.transactions ?? [],
    shopping: snap.shopping ?? [],
    pets: snap.pets ?? [],
    petWeights: snap.petWeights ?? [],
    petCares: snap.petCares ?? [],
    tasks: snap.tasks ?? [],
    events: snap.events ?? [],
  }
}

export function localImportPayload(state: AppState) {
  return {
    household: state.households.find((row) => row.id === state.activeHouseholdId) ?? state.households[0],
    members: state.members,
    transactions: state.transactions,
    shopping: state.shopping,
    pets: state.pets,
    petWeights: state.petWeights,
    petCares: state.petCares,
    tasks: state.tasks,
    events: state.events,
  }
}

export function hasLocalHouseholdData(state: AppState) {
  return (
    state.transactions.length +
      state.shopping.length +
      state.pets.length +
      state.tasks.length +
      state.events.length >
    0
  )
}

export async function api<T>(
  path: string,
  options?: { method?: string; body?: unknown; token?: string | null },
): Promise<T> {
  const base = apiUrl()
  if (!base) throw new Error('Falta la URL del servidor')
  const token = options?.token === undefined ? await getToken() : options.token
  let response: Response
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const hasBody = options?.body !== undefined
    response = await fetch(`${base}${path}`, {
      method: options?.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('El servidor no respondió. Revisa que esté encendido y en la misma red.')
    }
    throw new Error('No se pudo conectar con el servidor. ¿Está encendido el backend?')
  } finally {
    clearTimeout(timer)
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    if (response.status === 413) throw new Error('La foto es muy pesada. Recórtala o elige otra.')
    throw new Error(data.error || 'No se pudo completar la acción')
  }
  return data as T
}
