import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireMembership } from '../auth.js'
import { HttpError } from '../http.js'
import { prisma } from '../prisma.js'
import { commitSnapshot } from '../snapshot.js'

const taskSchema = z.object({
  title: z.string().trim().min(2),
  assignedMemberId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

const eventSchema = z.object({
  title: z.string().trim().min(2),
  date: z.string().trim().min(8),
  kind: z.string().optional(),
  note: z.string().optional(),
})

export async function agendaRoutes(app: FastifyInstance) {
  app.post('/tasks', async (request) => {
    const { user, household } = await requireMembership(request)
    const input = taskSchema.parse(request.body)
    await prisma.taskItem.create({
      data: {
        householdId: household.id,
        title: input.title,
        assignedMemberId: input.assignedMemberId || null,
        dueDate: input.dueDate || null,
        priority: input.priority || 'medium',
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.patch('/tasks/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = taskSchema.parse(request.body)
    const current = await prisma.taskItem.findFirst({ where: { id, householdId: household.id } })
    if (!current) throw new HttpError(404, 'Tarea no encontrada')
    await prisma.taskItem.update({
      where: { id },
      data: {
        title: input.title,
        assignedMemberId: input.assignedMemberId || null,
        dueDate: input.dueDate || null,
        priority: input.priority || 'medium',
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/tasks/:id/toggle', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const current = await prisma.taskItem.findFirst({ where: { id, householdId: household.id } })
    if (!current) throw new HttpError(404, 'Tarea no encontrada')
    await prisma.taskItem.update({ where: { id }, data: { done: !current.done } })
    return commitSnapshot(user.id, household.id)
  })

  app.delete('/tasks/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    await prisma.taskItem.deleteMany({ where: { id, householdId: household.id } })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/events', async (request) => {
    const { user, household } = await requireMembership(request)
    const input = eventSchema.parse(request.body)
    await prisma.calendarEvent.create({
      data: {
        householdId: household.id,
        title: input.title,
        date: input.date,
        kind: input.kind || 'other',
        note: input.note?.trim() || '',
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.patch('/events/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = eventSchema.parse(request.body)
    const current = await prisma.calendarEvent.findFirst({ where: { id, householdId: household.id } })
    if (!current) throw new HttpError(404, 'Aviso no encontrado')
    await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: input.title,
        date: input.date,
        kind: input.kind || 'other',
        note: input.note?.trim() || '',
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.delete('/events/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    await prisma.calendarEvent.deleteMany({ where: { id, householdId: household.id } })
    return commitSnapshot(user.id, household.id)
  })
}
