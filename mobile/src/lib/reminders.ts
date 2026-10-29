import type { AppState, UpcomingItem } from '../types'
import { addDays, todayISO } from './format'
import { joinPetNames, petIdsOf } from './pets'

const serviceWords = ['agua', 'luz', 'gas', 'boleta', 'servicio', 'internet', 'telefono', 'teléfono', 'arriendo']

function isServiceReminder(title: string, note: string, kind: string) {
  if (kind === 'payment') return true
  const text = `${title} ${note}`.toLowerCase()
  return serviceWords.some((word) => text.includes(word))
}

export function collectReminders(state: AppState, householdId: string): UpcomingItem[] {
  const members = state.members.filter((m) => m.householdId === householdId)
  const pets = state.pets.filter((p) => p.householdId === householdId)
  const items: UpcomingItem[] = []

  for (const event of state.events.filter((e) => e.householdId === householdId)) {
    items.push({
      id: `event-${event.id}`,
      title: event.title,
      date: event.date,
      kind: event.kind,
      meta: event.note || 'Aviso',
      href: '/calendario',
    })
  }

  for (const task of state.tasks.filter((t) => t.householdId === householdId && !t.done)) {
    const assignee = members.find((m) => m.id === task.assignedMemberId)
    const who = assignee ? assignee.name : 'Sin asignar'
    items.push({
      id: `task-${task.id}`,
      title: task.title,
      date: task.dueDate || todayISO(),
      kind: 'task',
      meta: task.dueDate ? `Tarea · ${who}` : `Tarea sin fecha · ${who}`,
      href: '/tareas',
    })
  }

  const pendingShopping = state.shopping.filter((item) => item.householdId === householdId && !item.purchased)
  if (pendingShopping.length > 0) {
    items.push({
      id: 'shopping-pending',
      title: 'Compras',
      date: todayISO(),
      kind: 'shopping',
      meta: `${pendingShopping.length} producto${pendingShopping.length === 1 ? '' : 's'}`,
      href: '/compras',
    })
  }

  for (const pet of pets) {
    if (!pet.nextVaccine) continue
    items.push({
      id: `vaccine-${pet.id}`,
      title: `Vacuna de ${pet.name}`,
      date: pet.nextVaccine,
      kind: 'pet',
      meta: pet.species,
      href: `/mascotas/${pet.id}`,
    })
  }

  const latestSupply = new Map<string, { careDate: string; item: UpcomingItem }>()
  for (const care of state.petCares) {
    if ((care.kind !== 'comida' && care.kind !== 'arena') || !care.nextDate) continue
    const ids = petIdsOf(care)
    const targets = pets.filter((p) => ids.includes(p.id))
    if (!targets.length) continue
    const key = `${care.kind}:${[...ids].sort().join(',')}`
    const prev = latestSupply.get(key)
    if (prev && care.date <= prev.careDate) continue
    const names = joinPetNames(pets, ids)
    const what = care.kind === 'arena' ? 'arena' : 'comida'
    latestSupply.set(key, {
      careDate: care.date,
      item: {
        id: `supply-${care.id}`,
        title: `Reponer ${what} de ${names}`,
        date: care.nextDate,
        kind: 'pet',
        meta: care.note ? `${care.note} · aviso de mascota` : 'Aviso de mascota',
        href: `/mascotas/${targets[0].id}`,
      },
    })
  }
  for (const entry of latestSupply.values()) items.push(entry.item)

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}

export function collectNotifications(state: AppState, householdId: string): UpcomingItem[] {
  const today = todayISO()
  const soon = addDays(today, 7)
  const recent = addDays(today, -7)
  const oldest = addDays(today, -60)
  const pets = state.pets.filter((pet) => pet.householdId === householdId)
  const items: UpcomingItem[] = []

  for (const product of state.shopping.filter((item) => item.householdId === householdId && item.purchased)) {
    const paid = state.transactions.find((row) => row.id === product.transactionId)
    const date = paid?.date || product.createdAt.slice(0, 10)
    if (date < recent || date > today) continue
    items.push({
      id: `bought-${product.id}`,
      title: `Compraste ${product.name}`,
      date,
      kind: 'shopping',
      meta: 'Compra hecha',
      href: '/compras',
    })
  }

  for (const product of state.shopping.filter((item) => item.householdId === householdId && !item.purchased)) {
    const date = product.createdAt.slice(0, 10)
    if (date >= today || date < oldest) continue
    items.push({
      id: `late-shop-${product.id}`,
      title: product.name,
      date,
      kind: 'shopping',
      meta: 'Compra atrasada',
      href: '/compras',
    })
  }

  for (const event of state.events.filter((item) => item.householdId === householdId)) {
    if (!isServiceReminder(event.title, event.note, event.kind)) continue
    if (event.date > soon || event.date < oldest) continue
    const late = event.date < today
    items.push({
      id: `bill-${event.id}`,
      title: event.title,
      date: event.date,
      kind: 'payment',
      meta: late ? 'Pago atrasado' : 'Pago por vencer',
      href: '/notificaciones',
    })
  }

  for (const pet of pets) {
    if (!pet.nextVaccine || pet.nextVaccine > soon || pet.nextVaccine < oldest) continue
    items.push({
      id: `notice-vaccine-${pet.id}`,
      title: `Vacuna de ${pet.name}`,
      date: pet.nextVaccine,
      kind: 'pet',
      meta: pet.nextVaccine < today ? 'Vacuna atrasada' : 'Vacuna próxima',
      href: `/mascotas/${pet.id}`,
    })
  }

  const latestSupply = new Map<string, { careDate: string; item: UpcomingItem }>()
  for (const care of state.petCares) {
    if ((care.kind !== 'comida' && care.kind !== 'arena') || !care.nextDate) continue
    if (care.nextDate > soon || care.nextDate < oldest) continue
    const ids = petIdsOf(care)
    const targets = pets.filter((pet) => ids.includes(pet.id))
    if (!targets.length) continue
    const key = `${care.kind}:${[...ids].sort().join(',')}`
    const prev = latestSupply.get(key)
    if (prev && care.date <= prev.careDate) continue
    const names = joinPetNames(pets, ids)
    const what = care.kind === 'arena' ? 'arena' : 'alimento'
    const late = care.nextDate < today
    latestSupply.set(key, {
      careDate: care.date,
      item: {
        id: `notice-supply-${care.id}`,
        title: care.kind === 'arena' ? `Arena de ${names}` : `Alimento de ${names}`,
        date: care.nextDate,
        kind: 'pet',
        meta: late ? `La ${what} ya debió acabarse` : `La ${what} se acaba pronto`,
        href: `/mascotas/${targets[0].id}`,
      },
    })
  }
  for (const entry of latestSupply.values()) items.push(entry.item)

  return items.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
}

export function remindersForDay(items: UpcomingItem[], iso: string) {
  return items.filter((item) => item.date === iso)
}

export function reminderDates(items: UpcomingItem[]) {
  return new Set(items.map((item) => item.date))
}
