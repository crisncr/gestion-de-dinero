import type { AppState } from '../types'

const KEY = 'hogar360.v1'

export const emptyState = (): AppState => ({
  users: [],
  sessionUserId: null,
  households: [],
  activeHouseholdId: null,
  members: [],
  transactions: [],
  shopping: [],
  pets: [],
  petWeights: [],
  petCares: [],
  tasks: [],
  events: [],
})

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AppState
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}
