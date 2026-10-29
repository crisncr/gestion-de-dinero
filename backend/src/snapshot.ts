import { prisma } from './prisma.js'
import { iso } from './logic.js'

export async function householdIdsForUser(userId: string) {
  const memberships = await prisma.member.findMany({
    where: { userId },
    select: { householdId: true },
  })
  return memberships.map((row) => row.householdId)
}

export async function buildSnapshot(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const householdIds = await householdIdsForUser(userId)
  const households = householdIds.length
    ? await prisma.household.findMany({ where: { id: { in: householdIds } } })
    : []
  const members = householdIds.length
    ? await prisma.member.findMany({ where: { householdId: { in: householdIds } } })
    : []
  const transactions = householdIds.length
    ? await prisma.transaction.findMany({
        where: { householdId: { in: householdIds } },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const shopping = householdIds.length
    ? await prisma.shoppingItem.findMany({
        where: { householdId: { in: householdIds } },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const pets = householdIds.length
    ? await prisma.pet.findMany({
        where: { householdId: { in: householdIds } },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const petWeights = pets.length
    ? await prisma.petWeight.findMany({
        where: { petId: { in: pets.map((pet) => pet.id) } },
      })
    : []
  const petCares = householdIds.length
    ? await prisma.petCare.findMany({
        where: { householdId: { in: householdIds } },
        include: { pets: true },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const tasks = householdIds.length
    ? await prisma.taskItem.findMany({
        where: { householdId: { in: householdIds } },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const events = householdIds.length
    ? await prisma.calendarEvent.findMany({
        where: { householdId: { in: householdIds } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const revision = households.reduce((sum, row) => sum + row.revision, 0)
  const managedHouseholds = new Set(
    members
      .filter((row) => row.userId === userId && (row.role === 'owner' || row.role === 'admin'))
      .map((row) => row.householdId),
  )

  return {
    revision,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: iso(user.createdAt),
    },
    activeHouseholdId: user.activeHouseholdId,
    households: households.map((row) => ({
      id: row.id,
      name: row.name,
      monthlyBudget: row.monthlyBudget,
      currency: row.currency,
      inviteCode: managedHouseholds.has(row.id) ? row.inviteCode : '',
      ownerId: row.ownerId,
      createdAt: iso(row.createdAt),
    })),
    members: members.map((row) => ({
      id: row.id,
      householdId: row.householdId,
      userId: row.userId,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: iso(row.createdAt),
    })),
    transactions: transactions.map((row) => ({
      id: row.id,
      householdId: row.householdId,
      memberId: row.memberId,
      type: row.type,
      amount: row.amount,
      category: row.category,
      description: row.description,
      date: row.date,
      createdAt: iso(row.createdAt),
    })),
    shopping: shopping.map((row) => ({
      id: row.id,
      householdId: row.householdId,
      name: row.name,
      category: row.category,
      quantity: row.quantity,
      price: row.price,
      offerTotal: row.offerTotal,
      purchased: row.purchased,
      transactionId: row.transactionId,
      createdAt: iso(row.createdAt),
    })),
    pets: pets.map((row) => ({
      id: row.id,
      householdId: row.householdId,
      name: row.name,
      species: row.species,
      weight: row.weight,
      photo: null,
      hasPhoto: Boolean(row.photo),
      nextVaccine: row.nextVaccine,
      notes: row.notes,
      createdAt: iso(row.createdAt),
    })),
    petWeights: petWeights.map((row) => ({
      id: row.id,
      petId: row.petId,
      weight: row.weight,
      date: row.date,
    })),
    petCares: petCares.map((row) => {
      const petIds = row.pets.map((link) => link.petId)
      return {
        id: row.id,
        petId: row.primaryPetId,
        petIds: petIds.length ? petIds : [row.primaryPetId],
        kind: row.kind,
        note: row.note,
        date: row.date,
        amount: row.amount,
        nextDate: row.nextDate,
        transactionId: row.transactionId,
      }
    }),
    tasks: tasks.map((row) => ({
      id: row.id,
      householdId: row.householdId,
      title: row.title,
      assignedMemberId: row.assignedMemberId,
      dueDate: row.dueDate,
      priority: row.priority,
      done: row.done,
      createdAt: iso(row.createdAt),
    })),
    events: events.map((row) => ({
      id: row.id,
      householdId: row.householdId,
      title: row.title,
      date: row.date,
      kind: row.kind,
      note: row.note,
      createdAt: iso(row.createdAt),
    })),
  }
}

export async function snapshotCursor(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const householdIds = await householdIdsForUser(userId)
  const rows = householdIds.length
    ? await prisma.household.findMany({
        where: { id: { in: householdIds } },
        select: { revision: true },
      })
    : []
  return {
    revision: rows.reduce((sum, row) => sum + row.revision, 0),
    activeHouseholdId: user.activeHouseholdId,
  }
}

export async function touchHouseholds(householdIds: string | string[]) {
  const ids = [...new Set((Array.isArray(householdIds) ? householdIds : [householdIds]).filter(Boolean))]
  await Promise.all(
    ids.map((id) =>
      prisma.household
        .update({
          where: { id },
          data: { revision: { increment: 1 } },
        })
        .catch(() => null),
    ),
  )
}

export async function commitSnapshot(userId: string, householdIds: string | string[]) {
  await touchHouseholds(householdIds)
  return buildSnapshot(userId)
}

export async function householdIsEmpty(householdId: string) {
  const [tx, shop, pets, tasks, events] = await Promise.all([
    prisma.transaction.count({ where: { householdId } }),
    prisma.shoppingItem.count({ where: { householdId } }),
    prisma.pet.count({ where: { householdId } }),
    prisma.taskItem.count({ where: { householdId } }),
    prisma.calendarEvent.count({ where: { householdId } }),
  ])
  return tx + shop + pets + tasks + events === 0
}
