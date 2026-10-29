import { getCurrency } from '../data/currencies'

export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthKey(iso = todayISO()) {
  return iso.slice(0, 7)
}

export function shiftMonth(key: string, delta: number) {
  return monthKey(addMonths(`${key}-01`, delta))
}

export function stampForMonth(key: string) {
  if (key === monthKey()) return new Date().toISOString()
  return new Date(`${key}-01T15:00:00.000Z`).toISOString()
}

export function parseISO(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00`)
}

export function money(value: number, currency = 'CLP') {
  const meta = getCurrency(currency)
  const amount = Number.isFinite(value) ? value : 0
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      maximumFractionDigits: meta.decimals,
      minimumFractionDigits: meta.decimals,
    }).format(amount)
  } catch {
    return `${meta.symbol}${amount.toFixed(meta.decimals)}`
  }
}

export function shortDate(iso: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
  }).format(parseISO(iso))
}

export function longDate(iso: string) {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(parseISO(iso))
}

export function monthTitle(key: string) {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, 1)
  return new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(2, Math.min(user.length - 1, 6)))}@${domain}`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, days: number) {
  const date = parseISO(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function addMonths(iso: string, months: number) {
  const date = parseISO(iso)
  date.setMonth(date.getMonth() + months)
  return toISODate(date)
}

export function daysBetween(from: string, to: string) {
  const a = parseISO(from).getTime()
  const b = parseISO(to).getTime()
  return Math.round((b - a) / 86_400_000)
}
