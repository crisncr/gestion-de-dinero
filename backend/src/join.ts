import { HttpError } from './http.js'
import { prisma } from './prisma.js'
import { touchHouseholds } from './snapshot.js'

export async function findHouseholdByInvite(code: string) {
  const inviteCode = code.trim().toUpperCase()
  if (inviteCode.length < 4) return null
  return prisma.household.findUnique({ where: { inviteCode } })
}

export async function addUserToHousehold(
  user: { id: string; name: string; email: string },
  householdId: string,
) {
  const already = await prisma.member.findFirst({
    where: { householdId, userId: user.id },
  })
  if (already) throw new HttpError(409, 'Ya formas parte de este hogar')
  const email = user.email.trim().toLowerCase()
  const invited = await prisma.member.findFirst({
    where: { householdId, userId: null, email },
  })
  if (invited) {
    await prisma.member.update({
      where: { id: invited.id },
      data: { userId: user.id, email, name: invited.name.trim() || user.name },
    })
  } else {
    await prisma.member.create({
      data: {
        householdId,
        userId: user.id,
        name: user.name,
        email,
        role: 'member',
      },
    })
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { activeHouseholdId: householdId },
  })
  await touchHouseholds(householdId)
}
