import { prisma } from './prisma.js'
import { touchHouseholds } from './snapshot.js'

async function wipeHousehold(householdId: string) {
  const cares = await prisma.petCare.findMany({
    where: { householdId },
    select: { id: true, transactionId: true },
  })
  const careIds = cares.map((row) => row.id)
  if (careIds.length) {
    await prisma.petCareOnPet.deleteMany({ where: { careId: { in: careIds } } })
  }
  await prisma.petCare.deleteMany({ where: { householdId } })
  const pets = await prisma.pet.findMany({ where: { householdId }, select: { id: true } })
  const petIds = pets.map((row) => row.id)
  if (petIds.length) {
    await prisma.petWeight.deleteMany({ where: { petId: { in: petIds } } })
  }
  await prisma.pet.deleteMany({ where: { householdId } })
  await prisma.shoppingItem.deleteMany({ where: { householdId } })
  await prisma.taskItem.deleteMany({ where: { householdId } })
  await prisma.calendarEvent.deleteMany({ where: { householdId } })
  await prisma.transaction.deleteMany({ where: { householdId } })
  await prisma.member.deleteMany({ where: { householdId } })
  await prisma.household.delete({ where: { id: householdId } })
}

async function removeMemberData(memberId: string) {
  await prisma.taskItem.updateMany({
    where: { assignedMemberId: memberId },
    data: { assignedMemberId: null },
  })
  await prisma.transaction.deleteMany({ where: { memberId } })
  await prisma.member.delete({ where: { id: memberId } })
}

export async function deleteUserAccount(userId: string) {
  const owned = await prisma.household.findMany({ where: { ownerId: userId } })

  for (const household of owned) {
    const others = await prisma.member.findMany({
      where: { householdId: household.id, userId: { not: userId } },
    })
    const otherUsers = others.filter((row) => row.userId)
    if (otherUsers.length === 0) {
      await wipeHousehold(household.id)
      continue
    }
    const nextOwner = otherUsers[0]
    await prisma.household.update({
      where: { id: household.id },
      data: { ownerId: nextOwner.userId as string },
    })
    await prisma.member.update({
      where: { id: nextOwner.id },
      data: { role: 'owner' },
    })
    await touchHouseholds(household.id)
  }

  const leftover = await prisma.member.findMany({ where: { userId } })
  for (const member of leftover) {
    const householdId = member.householdId
    await removeMemberData(member.id)
    await touchHouseholds(householdId)
  }

  await prisma.user.delete({ where: { id: userId } })
}
