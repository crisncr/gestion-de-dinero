import { HttpError } from './http.js'

type Bucket = { stamps: number[] }

const buckets = new Map<string, Bucket>()
const WINDOW_MS = 15 * 60 * 1000

function bucket(key: string) {
  const now = Date.now()
  const current = buckets.get(key) ?? { stamps: [] }
  current.stamps = current.stamps.filter((stamp) => now - stamp < WINDOW_MS)
  buckets.set(key, current)
  return current
}

export function assertAllowed(key: string, limit: number) {
  const current = bucket(key)
  if (current.stamps.length >= limit) {
    throw new HttpError(429, 'Demasiados intentos. Espera unos minutos.')
  }
}

export function markAttempt(key: string) {
  bucket(key).stamps.push(Date.now())
}

export function clearAttempts(key: string) {
  buckets.delete(key)
}

export function attemptCount(key: string) {
  return bucket(key).stamps.length
}
