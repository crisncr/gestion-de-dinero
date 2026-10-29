import { randomBytes } from 'node:crypto'

export function inviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(randomBytes(6), (b) => chars[b % chars.length]).join('')
}

export function shoppingExpenseCategory(id: string) {
  if (id === 'mercado') return 'alimentacion'
  if (id === 'limpieza' || id === 'hogar') return 'hogar'
  if (id === 'farmacia') return 'salud'
  if (id === 'mascotas') return 'mascotas'
  return 'otros'
}

const careLabels: Record<string, string> = {
  vacuna: 'Vacuna',
  comida: 'Comida',
  arena: 'Arena',
  paseo: 'Paseo',
  veterinario: 'Veterinario',
  medicina: 'Medicina',
  higiene: 'Higiene',
  otro: 'Otro',
}

export function careLabel(kind: string) {
  return careLabels[kind] ?? 'Cuidado'
}

export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function joinPetNames(pets: { id: string; name: string }[], ids: string[]) {
  const names = ids.map((id) => pets.find((pet) => pet.id === id)?.name).filter((name): name is string => Boolean(name))
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function iso(date: Date) {
  return date.toISOString()
}
