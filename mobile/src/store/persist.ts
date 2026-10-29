import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AppState, PetCare, ShoppingItem } from '../types'

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

function migratePetCare(care: PetCare): PetCare {
  const petIds = care.petIds?.length ? care.petIds : care.petId ? [care.petId] : []
  return {
    ...care,
    petIds,
    amount: care.amount ?? null,
    nextDate: care.nextDate ?? null,
    transactionId: care.transactionId ?? null,
  }
}

function migrateShopping(item: ShoppingItem): ShoppingItem {
  return {
    ...item,
    transactionId: item.transactionId ?? null,
  }
}

export function migrateState(parsed: Partial<AppState>): AppState {
  return {
    ...emptyState(),
    ...parsed,
    households: (parsed.households ?? []).map((household) => ({
      ...household,
      currency: household.currency || 'CLP',
      monthlyBudget: Number(household.monthlyBudget) || 0,
    })),
    shopping: (parsed.shopping ?? []).map(migrateShopping),
    petCares: (parsed.petCares ?? []).map(migratePetCare),
  }
}

export async function wipeLocalAccounts() {
  await AsyncStorage.removeItem(KEY)
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) return emptyState()
    return migrateState(JSON.parse(raw) as Partial<AppState>)
  } catch {
    return emptyState()
  }
}

export async function saveState(state: AppState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state))
}
