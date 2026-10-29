import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireMembership } from '../auth.js'
import { HttpError } from '../http.js'
import { shoppingExpenseCategory, shoppingLineTotal, todayISO } from '../logic.js'
import { prisma } from '../prisma.js'
import { commitSnapshot } from '../snapshot.js'

const txSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number(),
  category: z.string().trim().min(1),
  description: z.string().optional(),
  date: z.string().trim().min(8),
  memberId: z.string().nullable().optional(),
})

const shoppingSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2),
  category: z.string().trim().min(1),
  quantity: z.number().optional(),
  price: z.number().optional(),
  discount: z.number().optional(),
})

export async function moneyRoutes(app: FastifyInstance) {
  app.post('/transactions', async (request) => {
    const { user, household, membership } = await requireMembership(request)
    const input = txSchema.parse(request.body)
    const contributor =
      input.memberId &&
      (await prisma.member.findFirst({
        where: { id: input.memberId, householdId: household.id },
      }))
        ? input.memberId
        : membership.id
    const row = await prisma.transaction.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        householdId: household.id,
        memberId: contributor,
        type: input.type,
        amount: Math.abs(input.amount),
        category: input.category,
        description: input.description?.trim() || '',
        date: input.date,
      },
    })
    return { id: row.id, ...(await commitSnapshot(user.id, household.id)) }
  })

  app.patch('/transactions/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = txSchema.parse(request.body)
    const current = await prisma.transaction.findFirst({ where: { id, householdId: household.id } })
    if (!current) throw new HttpError(404, 'Movimiento no encontrado')
    await prisma.transaction.update({
      where: { id },
      data: {
        type: input.type,
        amount: Math.abs(input.amount),
        category: input.category,
        description: input.description?.trim() || '',
        date: input.date,
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.delete('/transactions/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    await prisma.transaction.deleteMany({ where: { id, householdId: household.id } })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/shopping', async (request) => {
    const { user, household } = await requireMembership(request)
    const input = shoppingSchema.parse(request.body)
    const row = await prisma.shoppingItem.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        householdId: household.id,
        name: input.name,
        category: input.category,
        quantity: Math.max(1, input.quantity ?? 1),
        price: Math.max(0, input.price ?? 0),
        discount: Math.max(0, input.discount ?? 0),
      },
    })
    return { id: row.id, ...(await commitSnapshot(user.id, household.id)) }
  })

  app.patch('/shopping/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const input = shoppingSchema.parse(request.body)
    const current = await prisma.shoppingItem.findFirst({ where: { id, householdId: household.id } })
    if (!current) throw new HttpError(404, 'Producto no encontrado')
    await prisma.shoppingItem.update({
      where: { id },
      data: {
        name: input.name,
        category: input.category,
        quantity: Math.max(1, input.quantity ?? 1),
        price: Math.max(0, input.price ?? 0),
        discount: Math.max(0, input.discount ?? current.discount),
      },
    })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/shopping/:id/toggle', async (request) => {
    const { user, household, membership } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const item = await prisma.shoppingItem.findFirst({ where: { id, householdId: household.id } })
    if (!item) throw new HttpError(404, 'Producto no encontrado')

    if (!item.purchased) {
      const total = shoppingLineTotal(item.price, item.quantity, item.discount)
      const tx =
        total > 0
          ? await prisma.transaction.create({
              data: {
                householdId: household.id,
                memberId: membership.id,
                type: 'expense',
                amount: total,
                category: shoppingExpenseCategory(item.category),
                description: item.name,
                date: todayISO(),
              },
            })
          : null
      await prisma.shoppingItem.update({
        where: { id },
        data: { purchased: true, transactionId: tx?.id ?? null },
      })
    } else {
      if (item.transactionId) {
        await prisma.transaction.deleteMany({ where: { id: item.transactionId } })
      }
      await prisma.shoppingItem.update({
        where: { id },
        data: { purchased: false, transactionId: null },
      })
    }
    return commitSnapshot(user.id, household.id)
  })

  app.delete('/shopping/:id', async (request) => {
    const { user, household } = await requireMembership(request)
    const { id } = request.params as { id: string }
    const item = await prisma.shoppingItem.findFirst({ where: { id, householdId: household.id } })
    if (item?.transactionId) {
      await prisma.transaction.deleteMany({ where: { id: item.transactionId } })
    }
    await prisma.shoppingItem.deleteMany({ where: { id, householdId: household.id } })
    return commitSnapshot(user.id, household.id)
  })

  app.post('/shopping/close-order', async (request) => {
    const { user, household, membership } = await requireMembership(request)
    const input = z
      .object({
        itemIds: z.array(z.string().uuid()).min(1),
        delivery: z.number().optional(),
        orderCoupon: z.number().optional(),
      })
      .parse(request.body)
    const delivery = Math.max(0, input.delivery ?? 0)
    const orderCoupon = Math.max(0, input.orderCoupon ?? 0)
    const items = await prisma.shoppingItem.findMany({
      where: { id: { in: input.itemIds }, householdId: household.id, purchased: false },
    })
    if (!items.length) throw new HttpError(400, 'No hay productos pendientes en este pedido')

    const created: { id: string; amount: number }[] = []
    for (const item of items) {
      const total = shoppingLineTotal(item.price, item.quantity, item.discount)
      const tx =
        total > 0
          ? await prisma.transaction.create({
              data: {
                householdId: household.id,
                memberId: membership.id,
                type: 'expense',
                amount: total,
                category: shoppingExpenseCategory(item.category),
                description: item.name,
                date: todayISO(),
              },
            })
          : null
      if (tx) created.push({ id: tx.id, amount: total })
      await prisma.shoppingItem.update({
        where: { id: item.id },
        data: { purchased: true, transactionId: tx?.id ?? null },
      })
    }

    const adjust = delivery - orderCoupon
    if (adjust > 0) {
      await prisma.transaction.create({
        data: {
          householdId: household.id,
          memberId: membership.id,
          type: 'expense',
          amount: adjust,
          category: 'alimentacion',
          description: orderCoupon > 0 ? 'Envío Uber Eats, con cupón del pedido' : 'Envío Uber Eats',
          date: todayISO(),
        },
      })
    } else if (adjust < 0) {
      let left = -adjust
      for (const row of [...created].sort((a, b) => b.amount - a.amount)) {
        if (left <= 0) break
        const cut = Math.min(left, row.amount)
        left -= cut
        const next = row.amount - cut
        if (next <= 0) {
          await prisma.transaction.delete({ where: { id: row.id } })
          await prisma.shoppingItem.updateMany({
            where: { transactionId: row.id },
            data: { transactionId: null },
          })
        } else {
          await prisma.transaction.update({ where: { id: row.id }, data: { amount: next } })
        }
      }
    }

    return commitSnapshot(user.id, household.id)
  })

  app.post('/shopping/clear-purchased', async (request) => {
    const { user, household } = await requireMembership(request)
    const spent = await prisma.shoppingItem.findMany({
      where: { householdId: household.id, purchased: true },
    })
    const txIds = spent.map((row) => row.transactionId).filter((id): id is string => Boolean(id))
    if (txIds.length) {
      await prisma.transaction.deleteMany({ where: { id: { in: txIds } } })
    }
    await prisma.shoppingItem.deleteMany({ where: { householdId: household.id, purchased: true } })
    return commitSnapshot(user.id, household.id)
  })
}
