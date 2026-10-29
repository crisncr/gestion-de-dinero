import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { DatePickerField, datePresets } from './DatePickerField'
import { PetPicker } from './PetPicker'
import { monthTitle, monthKey, shortDate, todayISO } from './lib/format'
import { defaultShareIds, petIdsOf } from './lib/pets'
import { useStore } from './store/StoreProvider'
import { colors, fonts } from './theme'
import type { Pet, PetCare, PetCareKind } from './types'
import { Button, Sheet, Field, useToast } from './ui'

const copy: Record<
  'comida' | 'arena' | 'otro',
  { buy: string; edit: string; product: string; placeholder: string; next: string }
> = {
  comida: {
    buy: 'Comprar comida',
    edit: 'Editar comida',
    product: 'Alimento',
    placeholder: 'Saco 15 kg, latas, snacks...',
    next: 'Aviso para reponer',
  },
  arena: {
    buy: 'Comprar arena',
    edit: 'Editar arena',
    product: 'Arena o higiene',
    placeholder: 'Arena aglomerante 10 kg',
    next: 'Aviso para reponer',
  },
  otro: {
    buy: 'Compra para mascotas',
    edit: 'Editar compra',
    product: 'Producto',
    placeholder: 'Juguete, transporte, antiparasitario...',
    next: 'Aviso para recordar',
  },
}

export function PetSupplySheet({
  open,
  kind,
  pets,
  focusPetId,
  care,
  currency,
  onClose,
}: {
  open: boolean
  kind: 'comida' | 'arena' | 'otro'
  pets: Pet[]
  focusPetId?: string
  care?: PetCare | null
  currency: string
  onClose: () => void
}) {
  const { addPetCare, updatePetCare } = useStore()
  const toast = useToast()
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selected, setSelected] = useState<string[]>([])
  const [product, setProduct] = useState('')
  const [price, setPrice] = useState('')
  const [boughtOn, setBoughtOn] = useState(todayISO())
  const [nextBuy, setNextBuy] = useState('')
  const text = copy[kind]
  const editing = mode === 'edit' && Boolean(care)

  useEffect(() => {
    if (!open) return
    if (care) {
      setMode('edit')
      setSelected(petIdsOf(care))
      setProduct(care.note)
      setPrice(care.amount ? String(care.amount) : '')
      setBoughtOn(care.date || todayISO())
      setNextBuy(care.nextDate ?? '')
      return
    }
    setMode('create')
    setSelected(focusPetId ? defaultShareIds(pets, focusPetId) : pets.map((pet) => pet.id))
    setProduct('')
    setPrice('')
    setBoughtOn(todayISO())
    setNextBuy('')
  }, [care, focusPetId, kind, open])

  const save = (asNew: boolean) => {
    if (selected.length === 0) return toast.push('Elige al menos una mascota')
    if (!product.trim()) return toast.push('Escribe el producto')
    const amount = Number(price)
    if (!amount) return toast.push('Ingresa el precio para sumarlo al gasto')
    if (nextBuy && nextBuy.slice(0, 10) <= (boughtOn || todayISO()).slice(0, 10)) {
      return toast.push('La fecha para reponer tiene que ser después de la compra.')
    }
    const payload = {
      kind: kind as PetCareKind,
      note: product,
      date: boughtOn || todayISO(),
      amount,
      nextDate: nextBuy || null,
      petIds: selected,
    }
    const what = kind === 'arena' ? 'arena' : kind === 'comida' ? 'comida' : 'producto'
    const aviso = nextBuy ? `Aviso creado: reponer ${what} el ${shortDate(nextBuy)}` : null
    if (editing && care && !asNew) {
      updatePetCare(care.id, payload)
      toast.push(aviso ?? 'Compra actualizada')
    } else {
      addPetCare(selected[0], payload)
      toast.push(aviso ?? `Compra guardada en ${monthTitle(monthKey(payload.date))}`)
    }
    onClose()
  }

  return (
    <Sheet open={open} title={editing ? text.edit : text.buy} onClose={onClose}>
      <PetPicker pets={pets} value={selected} onChange={setSelected} />
      <Field label={text.product} placeholder={text.placeholder} value={product} onChangeText={setProduct} />
      <Field label={`Precio (${currency})`} keyboardType="numeric" value={price} onChangeText={setPrice} />
      <DatePickerField label="Fecha de compra" value={boughtOn} onChange={setBoughtOn} presets={datePresets('event')} />
      <DatePickerField
        label={text.next}
        value={nextBuy}
        onChange={setNextBuy}
        optional
        presets={datePresets('refill')}
      />
      <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular }}>
        {nextBuy
          ? `Ese día sale un aviso en Inicio, Avisos y Calendario.`
          : 'Si eliges cuándo se acaba, se crea un aviso para reponer.'}
        {editing
          ? ' El gasto se actualiza una sola vez.'
          : ' El precio se descuenta en el mes de la fecha de compra, una sola vez.'}
      </Text>
      <Button title={editing ? 'Guardar cambios' : 'Guardar compra'} onPress={() => save(false)} />
      {editing ? (
        <Button title="Registrar otra compra" variant="secondary" onPress={() => save(true)} />
      ) : null}
    </Sheet>
  )
}
