export type Role = 'owner' | 'admin' | 'member'
export type TxType = 'income' | 'expense'
export type Priority = 'low' | 'medium' | 'high'
export type EventKind = 'payment' | 'task' | 'pet' | 'shopping' | 'other'
export type PetCareKind =
  | 'vacuna'
  | 'comida'
  | 'arena'
  | 'paseo'
  | 'veterinario'
  | 'medicina'
  | 'higiene'
  | 'otro'

export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  birthDate?: string | null
  createdAt: string
}

export type Household = {
  id: string
  name: string
  monthlyBudget: number
  currency: string
  inviteCode: string
  ownerId: string
  createdAt: string
}

export type Member = {
  id: string
  householdId: string
  userId: string | null
  name: string
  email: string
  role: Role
  createdAt: string
}

export type Transaction = {
  id: string
  householdId: string
  memberId: string
  type: TxType
  amount: number
  category: string
  description: string
  date: string
  createdAt: string
}

export type ShoppingItem = {
  id: string
  householdId: string
  name: string
  category: string
  quantity: number
  price: number
  purchased: boolean
  transactionId: string | null
  createdAt: string
}

export type Pet = {
  id: string
  householdId: string
  name: string
  species: string
  weight: number
  photo: string | null
  nextVaccine: string | null
  notes: string
  createdAt: string
}

export type PetWeight = {
  id: string
  petId: string
  weight: number
  date: string
}

export type PetCare = {
  id: string
  petId: string
  petIds: string[]
  kind: PetCareKind
  note: string
  date: string
  amount: number | null
  nextDate: string | null
  transactionId: string | null
}

export type PetCareInput = {
  kind: PetCareKind
  note: string
  date: string
  amount?: number | null
  nextDate?: string | null
  petIds?: string[]
}

export type TaskItem = {
  id: string
  householdId: string
  title: string
  assignedMemberId: string | null
  dueDate: string | null
  priority: Priority
  done: boolean
  createdAt: string
}

export type CalendarEvent = {
  id: string
  householdId: string
  title: string
  date: string
  kind: EventKind
  note: string
  createdAt: string
}

export type AppState = {
  users: User[]
  sessionUserId: string | null
  households: Household[]
  activeHouseholdId: string | null
  members: Member[]
  transactions: Transaction[]
  shopping: ShoppingItem[]
  pets: Pet[]
  petWeights: PetWeight[]
  petCares: PetCare[]
  tasks: TaskItem[]
  events: CalendarEvent[]
}

export type UpcomingItem = {
  id: string
  title: string
  date: string
  kind: EventKind
  meta: string
  href: string
}
