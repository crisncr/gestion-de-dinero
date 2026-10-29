export const MIN_ACCOUNT_AGE = 18
export const UNDERAGE_MESSAGE = 'Casa360 es solo para mayores de 18 años.'
export const UNDERAGE_DELETED_MESSAGE =
  'Casa360 es solo para mayores de 18 años. Eliminamos esta cuenta.'

export function adultBirthDate(value: string, now = new Date()): Date | 'invalid' | 'underage' {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return 'invalid'
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1900 || year > now.getUTCFullYear()) return 'invalid'
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return 'invalid'
  }
  if (date.getTime() > now.getTime()) return 'invalid'
  let age = now.getUTCFullYear() - year
  const nowMonth = now.getUTCMonth() + 1
  const nowDay = now.getUTCDate()
  if (nowMonth < month || (nowMonth === month && nowDay < day)) age -= 1
  if (age < MIN_ACCOUNT_AGE) return 'underage'
  return date
}
