import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { prisma } from './prisma.js'

export function makeVerifyCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashCode(code: string) {
  return createHash('sha256').update(code.trim()).digest('hex')
}

export function codesMatch(storedHash: string, code: string) {
  const next = Buffer.from(hashCode(code))
  const stored = Buffer.from(storedHash)
  if (next.length !== stored.length) return false
  return timingSafeEqual(next, stored)
}

export async function assignVerifyCode(userId: string) {
  const code = makeVerifyCode()
  await prisma.user.update({
    where: { id: userId },
    data: {
      verifyCodeHash: hashCode(code),
      verifyExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  })
  return code
}

export async function assignResetCode(userId: string) {
  const code = makeVerifyCode()
  await prisma.user.update({
    where: { id: userId },
    data: {
      resetCodeHash: hashCode(code),
      resetExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  })
  return code
}
