export const expenseCategories = [
  { id: 'alimentacion', label: 'Alimentación', accent: '#55D6A0' },
  { id: 'transporte', label: 'Transporte', accent: '#6F8F7E' },
  { id: 'hogar', label: 'Hogar', accent: '#8A8A8A' },
  { id: 'servicios', label: 'Servicios', accent: '#4A6B5C' },
  { id: 'salud', label: 'Salud', accent: '#C9A24A' },
  { id: 'ocio', label: 'Ocio', accent: '#5C6B66' },
  { id: 'mascotas', label: 'Mascotas', accent: '#3D4F47' },
  { id: 'otros', label: 'Otros', accent: '#929292' },
] as const

export const incomeCategories = [
  { id: 'sueldo', label: 'Sueldo', accent: '#55D6A0' },
  { id: 'extra', label: 'Ingreso extra', accent: '#6F8F7E' },
  { id: 'otros', label: 'Otros', accent: '#8A8A8A' },
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

export const careKinds = [
  { id: 'comida', label: 'Comida' },
  { id: 'paseo', label: 'Paseo' },
  { id: 'veterinario', label: 'Veterinario' },
  { id: 'medicina', label: 'Medicina' },
  { id: 'higiene', label: 'Higiene' },
  { id: 'otro', label: 'Otro' },
] as const

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

export function categoryLabel(
  id: string,
  list: readonly { id: string; label: string }[],
) {
  return list.find((item) => item.id === id)?.label ?? id
}

export function categoryAccent(id: string) {
  const all = [...expenseCategories, ...incomeCategories]
  return all.find((item) => item.id === id)?.accent ?? '#929292'
}
