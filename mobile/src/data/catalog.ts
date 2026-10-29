export const expenseCategories = [
  { id: 'alimentacion', label: 'Alimentación', accent: '#55D6A0' },
  { id: 'transporte', label: 'Transporte', accent: '#5B8CFF' },
  { id: 'hogar', label: 'Hogar', accent: '#E0B15A' },
  { id: 'servicios', label: 'Servicios', accent: '#A78BFA' },
  { id: 'salud', label: 'Salud', accent: '#E06A6A' },
  { id: 'ocio', label: 'Ocio', accent: '#F472B6' },
  { id: 'mascotas', label: 'Mascotas', accent: '#38BDF8' },
  { id: 'otros', label: 'Otros', accent: '#8E8E8E' },
] as const

export const incomeCategories = [
  { id: 'sueldo', label: 'Sueldo', accent: '#55D6A0' },
  { id: 'aporte', label: 'Aporte familiar', accent: '#A78BFA' },
  { id: 'extra', label: 'Ingreso extra', accent: '#5B8CFF' },
  { id: 'otros', label: 'Otros', accent: '#8E8E8E' },
] as const

export const shoppingCategories = [
  { id: 'mercado', label: 'Mercado' },
  { id: 'limpieza', label: 'Limpieza' },
  { id: 'farmacia', label: 'Farmacia' },
  { id: 'mascotas', label: 'Mascotas' },
  { id: 'hogar', label: 'Hogar' },
  { id: 'otros', label: 'Otros' },
] as const

export const petSpecies = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'] as const

export const speciesPacks = [
  { id: 'Perro', title: 'Perros', pack: 'La manada' },
  { id: 'Gato', title: 'Gatos', pack: 'La colonia' },
  { id: 'Ave', title: 'Aves', pack: 'El aviario' },
  { id: 'Conejo', title: 'Conejos', pack: 'La madriguera' },
  { id: 'Otro', title: 'Otros', pack: 'Los demás' },
] as const

export function speciesPack(species: string) {
  return speciesPacks.find((item) => item.id === species) ?? speciesPacks[4]
}

export const careKinds = [
  { id: 'vacuna', label: 'Vacuna' },
  { id: 'comida', label: 'Comida' },
  { id: 'arena', label: 'Arena' },
  { id: 'paseo', label: 'Paseo' },
  { id: 'veterinario', label: 'Veterinario' },
  { id: 'medicina', label: 'Medicina' },
  { id: 'higiene', label: 'Higiene' },
  { id: 'otro', label: 'Otro' },
] as const

export const speciesAccent: Record<string, string> = {
  Perro: '#5B8CFF',
  Gato: '#A78BFA',
  Ave: '#38BDF8',
  Conejo: '#F472B6',
  Otro: '#55D6A0',
}

export const eventKinds = [
  { id: 'payment', label: 'Pago' },
  { id: 'shopping', label: 'Compra' },
  { id: 'task', label: 'Tarea' },
  { id: 'pet', label: 'Mascota' },
  { id: 'other', label: 'Otro' },
] as const

export const priorities = [
  { id: 'low', label: 'Baja' },
  { id: 'medium', label: 'Media' },
  { id: 'high', label: 'Alta' },
] as const

export const roles = [
  { id: 'admin', label: 'Administrador' },
  { id: 'member', label: 'Integrante' },
] as const

export function categoryLabel(id: string, list: readonly { id: string; label: string }[]) {
  return list.find((item) => item.id === id)?.label ?? id
}

export function categoryAccent(id: string) {
  const all = [...expenseCategories, ...incomeCategories]
  return all.find((item) => item.id === id)?.accent ?? '#929292'
}

export function shoppingExpenseCategory(id: string) {
  if (id === 'mercado') return 'alimentacion'
  if (id === 'limpieza' || id === 'hogar') return 'hogar'
  if (id === 'farmacia') return 'salud'
  if (id === 'mascotas') return 'mascotas'
  return 'otros'
}
