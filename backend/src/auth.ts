import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { FastifyRequest } from 'fastify'
import { env } from './env.js'
import { HttpError } from './http.js'
import { prisma } from './prisma.js'

export type TokenPayload = {
  userId: string
  sv?: number
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function signToken(userId: string, sessionVersion = 0) {
  return jwt.sign({ userId, sv: sessionVersion } satisfies TokenPayload, env.jwtSecret, { expiresIn: '30d' })
}

export function readToken(request: FastifyRequest) {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Debes iniciar sesión')
  try {
    return jwt.verify(header.slice(7), env.jwtSecret) as TokenPayload
  } catch {
    throw new HttpError(401, 'Sesión vencida. Entra de nuevo')
  }
}

export async function requireUser(request: FastifyRequest) {
  const { userId, sv } = readToken(request)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new HttpError(401, 'Debes iniciar sesión')
  if ((sv ?? 0) !== user.sessionVersion) {
    throw new HttpError(401, 'Sesión cerrada. Entra de nuevo')
  }
  return user
}

export async function requireMembership(request: FastifyRequest) {
  const user = await requireUser(request)
  const householdId = user.activeHouseholdId
  if (!householdId) throw new HttpError(400, 'No hay un hogar activo')
  const household = await prisma.household.findUnique({ where: { id: householdId } })
  if (!household) throw new HttpError(400, 'No hay un hogar activo')
  const membership = await prisma.member.findFirst({
    where: { householdId, userId: user.id },
  })
  if (!membership) throw new HttpError(403, 'No perteneces a este hogar')
  return { user, household, membership }
}

export async function requireManager(request: FastifyRequest) {
  const ctx = await requireMembership(request)
  if (ctx.membership.role === 'member') {
    throw new HttpError(403, 'No tienes permiso')
  }
  return ctx
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
