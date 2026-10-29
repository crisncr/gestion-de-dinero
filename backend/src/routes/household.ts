import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { normalizeEmail, requireManager, requireMembership, requireUser } from '../auth.js'
import { HttpError } from '../http.js'
import { prisma } from '../prisma.js'
import { assertAllowed, clearAttempts, markAttempt } from '../guard.js'
import { addUserToHousehold, findHouseholdByInvite } from '../join.js'
import { buildSnapshot, commitSnapshot, householdIsEmpty, snapshotCursor } from '../snapshot.js'

const householdSchema = z.object({
  name: z.string().trim().min(2).optional(),
  monthlyBudget: z.number().optional(),
  currency: z.string().trim().min(3).max(8).optional(),
})

const memberSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().optional(),
  role: z.enum(['admin', 'member']).optional(),
})

export async function householdRoutes(app: FastifyInstance) {
  app.get('/sync', async (request) => {
    const user = await requireUser(request)
    return buildSnapshot(user.id)
  })

  app.get('/sync/revision', async (request) => {
    const user = await requireUser(request)
    return snapshotCursor(user.id)
  })

  app.patch('/households', async (request) => {
    const { user, household } = await requireManager(request)
    const input = householdSchema.parse(request.body)
    await prisma.household.update({
      where: { id: household.id },
      data: {
        name: input.name || undefined,
        monthlyBudget: input.monthlyBudget === undefined ? undefined : Math.max(0, input.monthlyBudget),
        currency: input.currency?.toUpperCase() || undefined,
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/households/active', async (request) => {
    const user = await requireUser(request)
    const input = z.object({ id: z.string().min(1) }).parse(request.body)
    const allowed = await prisma.member.findFirst({
      where: { householdId: input.id, userId: user.id },
    })
    if (!allowed) throw new HttpError(403, 'No perteneces a ese hogar')
    await prisma.user.update({ where: { id: user.id }, data: { activeHouseholdId: input.id } })
    return buildSnapshot(user.id)
  })

  app.post('/households/join', async (request) => {
    const user = await requireUser(request)
    const joinKey = `join:${user.id}`
    const ipKey = `join-ip:${request.ip}`
    assertAllowed(joinKey, 8)
    assertAllowed(ipKey, 30)
    const input = z.object({ code: z.string().trim().min(4) }).parse(request.body)
    const target = await findHouseholdByInvite(input.code)
    if (!target) {
      markAttempt(joinKey)
      markAttempt(ipKey)
      throw new HttpError(404, 'El código de invitación no es válido')
    }
    await addUserToHousehold(user, target.id)
    clearAttempts(joinKey)
    return buildSnapshot(user.id)
  })

  app.post('/members', async (request) => {
    const { user, household } = await requireManager(request)
    const input = memberSchema.parse(request.body)
    await prisma.member.create({
      data: {
        householdId: household.id,
        userId: null,
        name: input.name,
        email: normalizeEmail(input.email || ''),
        role: input.role || 'member',
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.patch('/members/:id', async (request) => {
    const { user, household } = await requireManager(request)
    const { id } = request.params as { id: string }
    const input = z
      .object({
        name: z.string().trim().min(2).optional(),
        role: z.enum(['admin', 'member']).optional(),
      })
      .parse(request.body)
    const target = await prisma.member.findFirst({ where: { id, householdId: household.id } })
    if (!target) throw new HttpError(404, 'Integrante no encontrado')
    if (target.role === 'owner') throw new HttpError(400, 'El titular no se puede modificar')
    await prisma.member.update({
      where: { id },
      data: {
        name: input.name || undefined,
        role: input.role || undefined,
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.delete('/members/:id', async (request) => {
    const { user, household } = await requireManager(request)
    const { id } = request.params as { id: string }
    const target = await prisma.member.findFirst({ where: { id, householdId: household.id } })
    if (!target) throw new HttpError(404, 'Integrante no encontrado')
    if (target.role === 'owner') throw new HttpError(400, 'No puedes quitar al titular')
    await prisma.transaction.updateMany({
      where: { memberId: id },
      data: { memberId: await ownerMemberId(household.id) },
    })
    await prisma.member.delete({ where: { id } })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/sync/import', async (request) => {
    const { user, household, membership } = await requireMembership(request)
    if (!(await householdIsEmpty(household.id))) {
      return buildSnapshot(user.id)
    }
    const input = z
      .object({
        members: z.array(z.any()).optional(),
        transactions: z.array(z.any()).optional(),
        shopping: z.array(z.any()).optional(),
        pets: z.array(z.any()).optional(),
        petWeights: z.array(z.any()).optional(),
        petCares: z.array(z.any()).optional(),
        tasks: z.array(z.any()).optional(),
        events: z.array(z.any()).optional(),
        household: z
          .object({
            name: z.string().optional(),
            currency: z.string().optional(),
          })
          .optional(),
      })
      .parse(request.body ?? {})

    if (input.household?.name || input.household?.currency) {
      await prisma.household.update({
        where: { id: household.id },
        data: {
          name: input.household.name || undefined,
          currency: input.household.currency || undefined,
        },
      })
    }

    const memberMap = new Map<string, string>()
    memberMap.set('self', membership.id)
    for (const row of input.members ?? []) {
      if (!row?.name || row.role === 'owner') continue
      const created = await prisma.member.create({
        data: {
          householdId: household.id,
          userId: null,
          name: String(row.name),
          email: normalizeEmail(String(row.email || '')),
          role: row.role === 'admin' ? 'admin' : 'member',
        },
      })
      if (row.id) memberMap.set(String(row.id), created.id)
    }

    const petMap = new Map<string, string>()
    for (const row of input.pets ?? []) {
      if (!row?.name) continue
      const created = await prisma.pet.create({
        data: {
          householdId: household.id,
          name: String(row.name),
          species: String(row.species || 'Otro'),
          weight: Number(row.weight) || 0,
          photo: row.photo || null,
          nextVaccine: row.nextVaccine || null,
          notes: String(row.notes || ''),
        },
      })
      if (row.id) petMap.set(String(row.id), created.id)
    }

    for (const row of input.petWeights ?? []) {
      const petId = petMap.get(String(row.petId))
      if (!petId) continue
      await prisma.petWeight.create({
        data: {
          petId,
          weight: Number(row.weight) || 0,
          date: String(row.date || ''),
        },
      })
    }

    const txMap = new Map<string, string>()
    for (const row of input.transactions ?? []) {
      if (!row?.amount) continue
      const created = await prisma.transaction.create({
        data: {
          householdId: household.id,
          memberId: memberMap.get(String(row.memberId)) || membership.id,
          type: row.type === 'income' ? 'income' : 'expense',
          amount: Math.abs(Number(row.amount) || 0),
          category: String(row.category || 'otros'),
          description: String(row.description || ''),
          date: String(row.date || ''),
        },
      })
      if (row.id) txMap.set(String(row.id), created.id)
    }

    for (const row of input.shopping ?? []) {
      if (!row?.name) continue
      await prisma.shoppingItem.create({
        data: {
          householdId: household.id,
          name: String(row.name),
          category: String(row.category || 'otros'),
          quantity: Math.max(1, Number(row.quantity) || 1),
          price: Math.max(0, Number(row.price) || 0),
          offerTotal: Number(row.offerTotal) > 0 ? Number(row.offerTotal) : null,
          purchased: Boolean(row.purchased),
          transactionId: row.transactionId ? txMap.get(String(row.transactionId)) ?? null : null,
        },
      })
    }

    for (const row of input.petCares ?? []) {
      const ids = (Array.isArray(row.petIds) ? row.petIds : [row.petId])
        .map((id: unknown) => petMap.get(String(id)))
        .filter((id: string | undefined): id is string => Boolean(id))
      if (!ids.length) continue
      const created = await prisma.petCare.create({
        data: {
          householdId: household.id,
          primaryPetId: ids[0],
          kind: String(row.kind || 'otro'),
          note: String(row.note || ''),
          date: String(row.date || ''),
          amount: row.amount ? Number(row.amount) : null,
          nextDate: row.nextDate || null,
          transactionId: row.transactionId ? txMap.get(String(row.transactionId)) ?? null : null,
          pets: { create: ids.map((petId: string) => ({ petId })) },
        },
      })
      void created
    }

    for (const row of input.tasks ?? []) {
      if (!row?.title) continue
      await prisma.taskItem.create({
        data: {
          householdId: household.id,
          title: String(row.title),
          assignedMemberId: row.assignedMemberId ? memberMap.get(String(row.assignedMemberId)) ?? null : null,
          dueDate: row.dueDate || null,
          priority: String(row.priority || 'medium'),
          done: Boolean(row.done),
        },
      })
    }

    for (const row of input.events ?? []) {
      if (!row?.title) continue
      await prisma.calendarEvent.create({
        data: {
          householdId: household.id,
          title: String(row.title),
          date: String(row.date || ''),
          kind: String(row.kind || 'other'),
          note: String(row.note || ''),
        },
      })
    }

    return commitSnapshot(user.id, household.id)
  })
}

async function ownerMemberId(householdId: string) {
  const owner = await prisma.member.findFirst({ where: { householdId, role: 'owner' } })
  if (!owner) throw new HttpError(400, 'Hogar sin titular')
  return owner.id
}
