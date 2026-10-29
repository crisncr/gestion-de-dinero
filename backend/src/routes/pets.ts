import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireMembership, requireUser } from '../auth.js'
import { HttpError } from '../http.js'
import { careLabel, joinPetNames, todayISO } from '../logic.js'
import { prisma } from '../prisma.js'
import { commitSnapshot, householdIdsForUser } from '../snapshot.js'

const petSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2),
  species: z.string().trim().min(1),
  weight: z.number().optional(),
  photo: z.string().nullable().optional(),
  nextVaccine: z.string().nullable().optional(),
  notes: z.string().optional(),
})

const careSchema = z.object({
  kind: z.string().trim().min(1),
  note: z.string().optional(),
  date: z.string().trim().min(8),
  amount: z.number().nullable().optional(),
  nextDate: z.string().nullable().optional(),
  paidOn: z.string().nullable().optional(),
  petIds: z.array(z.string()).optional(),
})

export async function petRoutes(app: FastifyInstance) {
  app.post('/pets', async (request) => {
    const { user, household } = await requireMembership(request)
    const input = petSchema.parse(request.body)
    const pet = await prisma.pet.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        householdId: household.id,
        name: input.name,
        species: input.species,
        weight: Math.max(0, input.weight ?? 0),
        photo: input.photo ?? null,
        nextVaccine: input.nextVaccine ?? null,
        notes: input.notes?.trim() || '',
      },
    })
    if ((input.weight ?? 0) > 0) {
      await prisma.petWeight.create({
        data: { petId: pet.id, weight: input.weight ?? 0, date: todayISO() },
      })
    }

    const inherited: Array<'comida' | 'arena'> = []
    const householdPets = await prisma.pet.findMany({ where: { householdId: household.id } })
    const cares = await prisma.petCare.findMany({
      where: { householdId: household.id, kind: { in: ['comida', 'arena'] } },
      include: { pets: true },
      orderBy: { createdAt: 'desc' },
    })
    const sameSpecies = new Set(
      householdPets.filter((row) => row.species === input.species && row.id !== pet.id).map((row) => row.id),
    )
    for (const kind of ['comida', 'arena'] as const) {
      const latest = cares.find(
        (care) => care.kind === kind && care.pets.some((link) => sameSpecies.has(link.petId)),
      )
      if (!latest) continue
      await prisma.petCareOnPet.create({ data: { careId: latest.id, petId: pet.id } })
      inherited.push(kind)
    }

    return { id: pet.id, inherited, ...(await commitSnapshot(user.id, household.id)) }
  })

  app.post('/pets/delete', async (request) => {
    const { user, household } = await requireMembership(request)
    const input = z
      .object({
        ids: z.array(z.string()).optional(),
        all: z.boolean().optional(),
      })
      .parse(request.body)
    const householdPets = await prisma.pet.findMany({
      where: { householdId: household.id },
      select: { id: true },
    })
    const targets = input.all
      ? householdPets.map((row) => row.id)
      : householdPets.map((row) => row.id).filter((id) => input.ids?.includes(id))
    for (const id of targets) {
      await deletePetRecord(household.id, id)
    }
    return commitSnapshot(user.id, household.id)
  })

  app.get('/pets/:id/photo', async (request) => {
    const user = await requireUser(request)
    const { id } = request.params as { id: string }
    const pet = await prisma.pet.findFirst({
      where: { id },
      select: { photo: true, householdId: true },
    })
    if (!pet) throw new HttpError(404, 'Mascota no encontrada')
    const allowed = await householdIdsForUser(user.id)
    if (!allowed.includes(pet.householdId)) throw new HttpError(403, 'No pertenece a tu hogar')
    return { photo: pet.photo }
  })

  app.patch('/pets/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = petSchema.parse(request.body)
    const pet = await prisma.pet.findFirst({ where: { id, householdId: household.id } })
    if (!pet) throw new HttpError(404, 'Mascota no encontrada')
    await prisma.pet.update({
      where: { id },
      data: {
        name: input.name,
        species: input.species,
        weight: Math.max(0, input.weight ?? 0),
        photo: input.photo ?? null,
        nextVaccine: input.nextVaccine ?? null,
        notes: input.notes?.trim() || '',
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.delete('/pets/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const deleted = await deletePetRecord(household.id, id)
    if (!deleted) throw new HttpError(404, 'Mascota no encontrada')
    return commitSnapshot(user.id, household.id)
  })

  app.post('/pets/:id/weights', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = z.object({ weight: z.number(), date: z.string().optional() }).parse(request.body)
    const pet = await prisma.pet.findFirst({ where: { id, householdId: household.id } })
    if (!pet) throw new HttpError(404, 'Mascota no encontrada')
    await prisma.pet.update({ where: { id }, data: { weight: input.weight } })
    await prisma.petWeight.create({
      data: { petId: id, weight: input.weight, date: input.date || todayISO() },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/pets/:id/cares', async (request) => {
    const { user, household, membership } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = careSchema.parse(request.body)
    return saveCare({ userId: user.id, householdId: household.id, memberId: membership.id, petId: id, input })
  })

  app.patch('/cares/:id', async (request) => {
    const { user, household, membership } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = careSchema.parse(request.body)
    const current = await prisma.petCare.findFirst({
      where: { id, householdId: household.id },
      include: { pets: true },
    })
    if (!current) throw new HttpError(404, 'Compra no encontrada')
    return saveCare({
      userId: user.id,
      householdId: household.id,
      memberId: membership.id,
      petId: current.primaryPetId,
      input,
      careId: id,
    })
  })
}

async function saveCare({
  userId,
  householdId,
  memberId,
  petId,
  input,
  careId,
}: {
  userId: string
  householdId: string
  memberId: string
  petId: string
  careId?: string
  input: z.infer<typeof careSchema>
}) {
  const householdPets = await prisma.pet.findMany({ where: { householdId } })
  const selected = [...new Set(input.petIds?.length ? input.petIds : [petId])].filter((id) =>
    householdPets.some((pet) => pet.id === id),
  )
  if (!selected.length) throw new HttpError(400, 'Elige al menos una mascota')
  const amount = input.amount && input.amount > 0 ? input.amount : null
  const nextDate = input.nextDate || null
  const paidOn = (input.paidOn || input.date).slice(0, 10)
  if (nextDate && nextDate.slice(0, 10) <= input.date.slice(0, 10)) {
    throw new HttpError(400, 'La fecha siguiente tiene que ser después de la primera.')
  }
  const note = input.note?.trim() || ''
  const names = joinPetNames(householdPets, selected)
  const description = note
    ? selected.length > 1
      ? `${note} · para ${names}`
      : note
    : `${careLabel(input.kind)} para ${names}`

  const current = careId
    ? await prisma.petCare.findUnique({ where: { id: careId } })
    : null

  let transactionId = amount ? current?.transactionId || undefined : current?.transactionId || undefined
  if (amount) {
    if (current?.transactionId) {
      await prisma.transaction.update({
        where: { id: current.transactionId },
        data: {
          amount,
          description,
          date: paidOn,
          category: 'mascotas',
          type: 'expense',
        },
      })
      transactionId = current.transactionId
    } else {
      const tx = await prisma.transaction.create({
        data: {
          householdId,
          memberId,
          type: 'expense',
          amount,
          category: 'mascotas',
          description,
          date: paidOn,
        },
      })
      transactionId = tx.id
    }
  } else if (current?.transactionId) {
    await prisma.transaction.deleteMany({ where: { id: current.transactionId } })
    transactionId = undefined
  }

  const care = current
    ? await prisma.petCare.update({
        where: { id: current.id },
        data: {
          primaryPetId: selected[0],
          kind: input.kind,
          note,
          date: input.date,
          amount,
          nextDate,
          transactionId: amount ? transactionId : null,
        },
      })
    : await prisma.petCare.create({
        data: {
          householdId,
          primaryPetId: selected[0],
          kind: input.kind,
          note,
          date: input.date,
          amount,
          nextDate,
          transactionId: amount ? transactionId : null,
        },
      })

  await prisma.petCareOnPet.deleteMany({ where: { careId: care.id } })
  await prisma.petCareOnPet.createMany({
    data: selected.map((id) => ({ careId: care.id, petId: id })),
  })

  if (input.kind === 'vacuna' && nextDate) {
    await prisma.pet.updateMany({
      where: { id: { in: selected } },
      data: { nextVaccine: nextDate },
    })
  }

  return commitSnapshot(userId, householdId)
}

async function deletePetRecord(householdId: string, id: string) {
  const pet = await prisma.pet.findFirst({ where: { id, householdId } })
  if (!pet) return false
  const cares = await prisma.petCare.findMany({
    where: { householdId, pets: { some: { petId: id } } },
    include: { pets: true },
  })
  for (const care of cares) {
    const left = care.pets.filter((link) => link.petId !== id)
    if (left.length === 0) {
      if (care.transactionId) await prisma.transaction.deleteMany({ where: { id: care.transactionId } })
      await prisma.petCare.delete({ where: { id: care.id } })
    } else {
      await prisma.petCareOnPet.delete({ where: { careId_petId: { careId: care.id, petId: id } } })
      await prisma.petCare.update({
        where: { id: care.id },
        data: { primaryPetId: left[0].petId },
      })
    }
  }
  await prisma.pet.delete({ where: { id } })
  return true
}
