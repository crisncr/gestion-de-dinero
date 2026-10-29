import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { deleteUserAccount } from '../account.js'
import { UNDERAGE_DELETED_MESSAGE, UNDERAGE_MESSAGE, adultBirthDate } from '../age.js'
import { hashPassword, normalizeEmail, requireUser, signToken, verifyPassword } from '../auth.js'
import { assertAllowed, attemptCount, clearAttempts, markAttempt } from '../guard.js'
import { HttpError } from '../http.js'
import { LEGAL_VERSION, consentPayload, requireLegalConsent } from '../legal.js'
import { addUserToHousehold, findHouseholdByInvite } from '../join.js'
import { inviteCode } from '../logic.js'
import { maskEmail, sendRecoveryEmail, sendVerificationEmail } from '../mail.js'
import { prisma } from '../prisma.js'
import { buildSnapshot, commitSnapshot, householdIdsForUser } from '../snapshot.js'
import { assignResetCode, assignVerifyCode, codesMatch } from '../verify.js'

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().min(3),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  householdName: z.string().trim().min(2),
  monthlyBudget: z.number().optional(),
  currency: z.string().trim().min(3).max(8).optional(),
  acceptedTerms: z.boolean(),
  termsVersion: z.string(),
  inviteCode: z.string().optional(),
  birthDate: z.string().trim().min(8),
})

const loginSchema = z.object({
  email: z.string().trim().min(3),
  password: z.string().min(1),
  acceptedTerms: z.boolean().optional(),
  termsVersion: z.string().optional(),
})

const recoverStartSchema = z.object({
  email: z.string().trim().min(3),
})

const recoverCheckSchema = z.object({
  email: z.string().trim().min(3),
  code: z.string().trim().min(4).max(8),
})

const recoverFinishSchema = z.object({
  email: z.string().trim().min(3),
  code: z.string().trim().min(4).max(8),
  password: z.string().min(8),
})

const passwordSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(8, 'Mínimo 8 caracteres'),
})

const emailSchema = z.object({
  email: z.string().trim().min(3),
})

const verifySchema = z.object({
  email: z.string().trim().min(3),
  code: z.string().trim().min(4).max(8),
})

const birthDateSchema = z.object({
  email: z.string().trim().min(3),
  password: z.string().min(1),
  birthDate: z.string().trim().min(8),
  acceptedTerms: z.boolean().optional(),
  termsVersion: z.string().optional(),
})

function requireAdultDate(value: string) {
  const parsed = adultBirthDate(value)
  if (parsed === 'invalid') throw new HttpError(400, 'La fecha de nacimiento no es válida')
  if (parsed === 'underage') throw new HttpError(403, UNDERAGE_MESSAGE)
  return parsed
}

type SessionUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  birthDate: Date | null
  consentAt: Date | null
  termsVersion: string | null
  activeHouseholdId: string | null
  sessionVersion: number
}

async function completeLogin(
  user: SessionUser,
  input: { acceptedTerms?: boolean; termsVersion?: string },
) {
  if (!user.birthDate) {
    return { needsBirthDate: true as const, email: user.email }
  }
  const hasCurrentConsent = Boolean(user.consentAt && user.termsVersion === LEGAL_VERSION)
  if (!hasCurrentConsent) {
    if (input.acceptedTerms !== true || input.termsVersion !== LEGAL_VERSION) {
      return { needsConsent: true as const, email: user.email }
    }
    await prisma.user.update({
      where: { id: user.id },
      data: consentPayload(),
    })
  }
  if (!user.emailVerified) {
    try {
      const household = user.activeHouseholdId
        ? await prisma.household.findUnique({ where: { id: user.activeHouseholdId } })
        : null
      await sendCode(user, household?.name)
    } catch (error) {
      console.error('No se pudo enviar el código', error)
    }
    return { needsVerification: true as const, email: user.email, maskedEmail: maskEmail(user.email) }
  }
  if (!user.activeHouseholdId) {
    const first = await prisma.member.findFirst({ where: { userId: user.id } })
    if (first) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeHouseholdId: first.householdId },
      })
    }
  }
  return { token: signToken(user.id, user.sessionVersion), ...(await buildSnapshot(user.id)) }
}

async function rejectResetCode(userId: string, codeKey: string): Promise<never> {
  markAttempt(codeKey)
  if (attemptCount(codeKey) >= 5) {
    await prisma.user.update({
      where: { id: userId },
      data: { resetCodeHash: null, resetExpires: null },
    })
    throw new HttpError(429, 'Demasiados intentos. Pide un código nuevo.')
  }
  throw new HttpError(400, 'El código no es correcto')
}

async function sendCode(user: { id: string; name: string; email: string }, householdName?: string) {
  const code = await assignVerifyCode(user.id)
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    householdName,
    code,
  })
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request) => {
    const input = registerSchema.parse(request.body)
    try {
      requireLegalConsent(input)
    } catch (error) {
      throw new HttpError(400, error instanceof Error ? error.message : 'Debes aceptar los Términos')
    }
    const email = normalizeEmail(input.email)
    const birthDate = requireAdultDate(input.birthDate)
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) throw new HttpError(409, 'Ese correo ya tiene una cuenta')
    const invited = input.inviteCode?.trim()
      ? await findHouseholdByInvite(input.inviteCode)
      : null
    if (input.inviteCode?.trim() && !invited) {
      throw new HttpError(404, 'El código de invitación no es válido')
    }

    const passwordHash = await hashPassword(input.password)
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
          birthDate,
          emailVerified: false,
          ...consentPayload(),
        },
      })
      const household = await tx.household.create({
        data: {
          name: input.householdName.trim(),
          monthlyBudget: Math.max(0, input.monthlyBudget ?? 0),
          currency: input.currency?.toUpperCase() || 'CLP',
          inviteCode: inviteCode(),
          ownerId: user.id,
        },
      })
      await tx.member.create({
        data: {
          householdId: household.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: 'owner',
        },
      })
      await tx.user.update({
        where: { id: user.id },
        data: { activeHouseholdId: household.id },
      })
      return user
    })

    if (invited) {
      await addUserToHousehold(created, invited.id)
    }

    try {
      await sendCode(created, invited?.name || input.householdName.trim())
    } catch (error) {
      console.error('No se pudo enviar el código', error)
    }
    return { needsVerification: true, email: created.email, maskedEmail: maskEmail(created.email) }
  })

  app.post('/auth/login', async (request) => {
    const input = loginSchema.parse(request.body)
    const email = normalizeEmail(input.email)
    const loginKey = `login:${email}`
    assertAllowed(loginKey, 8)
    assertAllowed(`login-ip:${request.ip}`, 30)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      markAttempt(loginKey)
      markAttempt(`login-ip:${request.ip}`)
      throw new HttpError(401, 'Correo o contraseña incorrectos')
    }
    clearAttempts(loginKey)
    return completeLogin(user, input)
  })

  app.post('/auth/birth-date', async (request) => {
    const input = birthDateSchema.parse(request.body)
    const email = normalizeEmail(input.email)
    const loginKey = `login:${email}`
    assertAllowed(loginKey, 8)
    assertAllowed(`login-ip:${request.ip}`, 30)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      markAttempt(loginKey)
      markAttempt(`login-ip:${request.ip}`)
      throw new HttpError(401, 'Correo o contraseña incorrectos')
    }
    clearAttempts(loginKey)
    const parsed = adultBirthDate(input.birthDate)
    if (parsed === 'invalid') throw new HttpError(400, 'La fecha de nacimiento no es válida')
    if (parsed === 'underage') {
      await deleteUserAccount(user.id)
      throw new HttpError(403, UNDERAGE_DELETED_MESSAGE)
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { birthDate: parsed },
    })
    return completeLogin(updated, input)
  })

  app.post('/auth/verify', async (request) => {
    const input = verifySchema.parse(request.body)
    const email = normalizeEmail(input.email)
    const codeKey = `verify:${email}`
    assertAllowed(codeKey, 5)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.verifyCodeHash || !user.verifyExpires) {
      throw new HttpError(400, 'Pide un código nuevo')
    }
    if (user.verifyExpires.getTime() < Date.now()) {
      throw new HttpError(400, 'El código venció. Pide uno nuevo')
    }
    if (!codesMatch(user.verifyCodeHash, input.code)) {
      markAttempt(codeKey)
      if (attemptCount(codeKey) >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: { verifyCodeHash: null, verifyExpires: null },
        })
        throw new HttpError(429, 'Demasiados intentos. Pide un código nuevo.')
      }
      throw new HttpError(400, 'El código no es correcto')
    }
    clearAttempts(codeKey)
    if (!user.birthDate) {
      throw new HttpError(403, 'Entra de nuevo e indica tu fecha de nacimiento.')
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyCodeHash: null,
        verifyExpires: null,
      },
    })
    return { token: signToken(user.id, user.sessionVersion), ...(await buildSnapshot(user.id)) }
  })

  app.post('/auth/resend', async (request) => {
    const input = emailSchema.parse(request.body)
    const email = normalizeEmail(input.email)
    assertAllowed(`resend:${email}`, 3)
    markAttempt(`resend:${email}`)
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && user.birthDate && !user.emailVerified) {
      const household = user.activeHouseholdId
        ? await prisma.household.findUnique({ where: { id: user.activeHouseholdId } })
        : null
      try {
        await sendCode(user, household?.name)
      } catch (error) {
        console.error('No se pudo reenviar el código', error)
      }
    }
    return { ok: true, maskedEmail: maskEmail(email) }
  })

  app.post('/auth/recover/start', async (request) => {
    const input = recoverStartSchema.parse(request.body)
    const email = normalizeEmail(input.email)
    assertAllowed(`recover:${email}`, 3)
    markAttempt(`recover:${email}`)
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      try {
        const code = await assignResetCode(user.id)
        await sendRecoveryEmail({ to: user.email, name: user.name, code })
      } catch (error) {
        console.error('No se pudo enviar el código de recuperación', error)
      }
    }
    return { ok: true, email, maskedEmail: maskEmail(email) }
  })

  app.post('/auth/recover/check', async (request) => {
    const input = recoverCheckSchema.parse(request.body)
    const email = normalizeEmail(input.email)
    const codeKey = `reset:${email}`
    assertAllowed(codeKey, 5)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.resetCodeHash || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
      throw new HttpError(400, 'El código no es válido o venció')
    }
    if (!codesMatch(user.resetCodeHash, input.code)) {
      await rejectResetCode(user.id, codeKey)
    }
    return { ok: true }
  })

  app.post('/auth/recover/finish', async (request) => {
    const input = recoverFinishSchema.parse(request.body)
    const email = normalizeEmail(input.email)
    const codeKey = `reset:${email}`
    assertAllowed(codeKey, 5)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.resetCodeHash || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
      throw new HttpError(400, 'El código no es válido o venció')
    }
    if (!codesMatch(user.resetCodeHash, input.code)) {
      await rejectResetCode(user.id, codeKey)
    }
    clearAttempts(codeKey)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.password),
        resetCodeHash: null,
        resetExpires: null,
        sessionVersion: { increment: 1 },
      },
    })
    return { ok: true }
  })

  app.get('/auth/me', async (request) => {
    const user = await requireUser(request)
    if (!user.birthDate) {
      throw new HttpError(401, 'Entra de nuevo e indica tu fecha de nacimiento.')
    }
    if (!user.emailVerified) {
      throw new HttpError(401, 'Debes activar tu cuenta')
    }
    return { token: signToken(user.id, user.sessionVersion), ...(await buildSnapshot(user.id)) }
  })

  app.post('/auth/logout', async (request) => {
    const user = await requireUser(request)
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
    })
    return { ok: true }
  })

  app.patch('/auth/profile', async (request) => {
    const user = await requireUser(request)
    const input = z.object({ name: z.string().trim().min(2) }).parse(request.body)
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { name: input.name } }),
      prisma.member.updateMany({ where: { userId: user.id }, data: { name: input.name } }),
    ])
    return commitSnapshot(user.id, await householdIdsForUser(user.id))
  })

  app.post('/auth/change-password', async (request) => {
    const user = await requireUser(request)
    const input = passwordSchema.parse(request.body)
    if (!(await verifyPassword(input.current, user.passwordHash))) {
      throw new HttpError(400, 'La contraseña actual no es correcta')
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.next),
        sessionVersion: { increment: 1 },
      },
    })
    return { ok: true, token: signToken(updated.id, updated.sessionVersion) }
  })

  app.delete('/auth/account', async (request) => {
    const user = await requireUser(request)
    await deleteUserAccount(user.id)
    return { ok: true }
  })
}
