import type { AppState, UpcomingItem } from '../types'
import { joinPetNames, petIdsOf } from './pets'

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

  for (const task of state.tasks.filter((t) => t.householdId === householdId && !t.done && t.dueDate)) {
    const assignee = members.find((m) => m.id === task.assignedMemberId)
    items.push({
      id: `task-${task.id}`,
      title: task.title,
      date: task.dueDate as string,
      kind: 'task',
      meta: assignee ? `Tarea · ${assignee.name}` : 'Tarea sin asignar',
      href: '/tareas',
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

export function remindersForDay(items: UpcomingItem[], iso: string) {
  return items.filter((item) => item.date === iso)
}

export function reminderDates(items: UpcomingItem[]) {
  return new Set(items.map((item) => item.date))
}
