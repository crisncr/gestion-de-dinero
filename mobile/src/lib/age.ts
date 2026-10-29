export const MIN_ACCOUNT_AGE = 18
export const UNDERAGE_MESSAGE = 'Casa360 es solo para mayores de 18 años.'

export function birthDateIso(day: string, month: string, year: string): string | null {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return null
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const date = new Date(`${iso}T00:00:00.000Z`)
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  if (date.getTime() > Date.now()) return null
  return iso
}

export function isAdultBirthDate(iso: string, now = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  let age = now.getUTCFullYear() - year
  const nowMonth = now.getUTCMonth() + 1
  const nowDay = now.getUTCDate()
  if (nowMonth < month || (nowMonth === month && nowDay < day)) age -= 1
  return age >= MIN_ACCOUNT_AGE
}
