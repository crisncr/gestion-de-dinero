import { speciesAccent } from '../data/catalog'
import type { Pet, PetCare, PetCareKind } from '../types'
import { daysBetween, shortDate, todayISO } from './format'

export function petIdsOf(care: PetCare) {
  return care.petIds?.length ? care.petIds : [care.petId]
}

export function careAppliesTo(care: PetCare, petId: string) {
  return petIdsOf(care).includes(petId)
}

export function caresForPet(cares: PetCare[], petId: string) {
  return cares.filter((care) => careAppliesTo(care, petId))
}

export function joinPetNames(pets: Pick<Pet, 'id' | 'name'>[], ids: string[]) {
  const names = ids.map((id) => pets.find((pet) => pet.id === id)?.name).filter((name): name is string => Boolean(name))
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function defaultShareIds(pets: Pick<Pet, 'id' | 'species'>[], currentId: string) {
  const current = pets.find((pet) => pet.id === currentId)
  if (!current) return [currentId]
  const same = pets.filter((pet) => pet.species === current.species).map((pet) => pet.id)
  return same.length ? same : [currentId]
}

export function petColor(species: string) {
  return speciesAccent[species] ?? speciesAccent.Otro
}

export function latestCare(cares: PetCare[], kind: PetCareKind) {
  return cares
    .filter((item) => item.kind === kind)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.nextDate ?? '').localeCompare(a.nextDate ?? ''))[0] ?? null
}

export function latestSpeciesSupply(
  cares: PetCare[],
  pets: Pick<Pet, 'id' | 'species'>[],
  species: string,
  kind: PetCareKind,
) {
  const ids = new Set(pets.filter((pet) => pet.species === species).map((pet) => pet.id))
  return cares
    .filter((care) => care.kind === kind && petIdsOf(care).some((id) => ids.has(id)))
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

export function vaccineStatus(nextVaccine: string | null) {
  if (!nextVaccine) {
    return { label: 'Sin vacuna programada', detail: 'Agenda la próxima dosis', tone: 'mute' as const }
  }
  const delta = daysBetween(todayISO(), nextVaccine)
  if (delta < 0) {
    const days = Math.abs(delta)
    return {
      label: 'Vacuna vencida',
      detail: `Hace ${days} día${days === 1 ? '' : 's'} · ${shortDate(nextVaccine)}`,
      tone: 'danger' as const,
    }
  }
  if (delta === 0) {
    return { label: 'Vacuna hoy', detail: 'Llévala al veterinario', tone: 'warn' as const }
  }
  if (delta <= 7) {
    return {
      label: `Vacuna en ${delta} días`,
      detail: shortDate(nextVaccine),
      tone: 'warn' as const,
    }
  }
  return {
    label: `Próxima vacuna ${shortDate(nextVaccine)}`,
    detail: 'Al día',
    tone: 'ok' as const,
  }
}

export function supplyStatus(care: PetCare | null, empty: string) {
  if (!care) return { label: empty, detail: 'Aún no hay compras', tone: 'mute' as const }
  if (care.nextDate) {
    const delta = daysBetween(todayISO(), care.nextDate)
    if (delta < 0) {
      return { label: 'Se está acabando', detail: `Debía reponer ${shortDate(care.nextDate)}`, tone: 'danger' as const }
    }
    if (delta <= 5) {
      return { label: `Reponer ${shortDate(care.nextDate)}`, detail: care.note || 'Compra reciente', tone: 'warn' as const }
    }
    return { label: `Próxima compra ${shortDate(care.nextDate)}`, detail: care.note || shortDate(care.date), tone: 'ok' as const }
  }
  return {
    label: care.note || 'Última compra',
    detail: shortDate(care.date),
    tone: 'ok' as const,
  }
}

export function toneColor(tone: 'mute' | 'ok' | 'warn' | 'danger') {
  if (tone === 'danger') return '#E06A6A'
  if (tone === 'warn') return '#E0B15A'
  if (tone === 'ok') return '#55D6A0'
  return '#8E8E8E'
}
