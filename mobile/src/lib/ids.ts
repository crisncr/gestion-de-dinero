import * as Crypto from 'expo-crypto'

export function uid() {
  if (typeof Crypto.randomUUID === 'function') {
    return Crypto.randomUUID()
  }
  const bytes = Crypto.getRandomBytes(16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function inviteCode() {
  const bytes = Crypto.getRandomBytes(6)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
