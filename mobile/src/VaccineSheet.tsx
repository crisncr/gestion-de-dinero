import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { DatePickerField, datePresets } from './DatePickerField'
import { monthKey, monthTitle, shortDate, todayISO } from './lib/format'
import { caresForPet, latestCare } from './lib/pets'
import { useStore } from './store/StoreProvider'
import { colors, fonts } from './theme'
import type { Pet } from './types'
import { Button, Field, Sheet, useToast } from './ui'

export function VaccineSheet({
  open,
  pet,
  currency,
  onClose,
}: {
  open: boolean
  pet: Pet | null
  currency: string
  onClose: () => void
}) {
  const { state, addPetCare, updatePetCare } = useStore()
  const toast = useToast()
  const latest = pet ? latestCare(caresForPet(state.petCares, pet.id), 'vacuna') : null
  const [name, setName] = useState('')
  const [applied, setApplied] = useState(todayISO())
  const [paidOn, setPaidOn] = useState(todayISO())
  const [next, setNext] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (!open || !pet) return
    if (latest) {
      const paid = latest.transactionId
        ? state.transactions.find((row) => row.id === latest.transactionId)?.date
        : ''
      setName(latest.note)
      setApplied(latest.date || todayISO())
      setPaidOn(paid || latest.date || todayISO())
      setNext(latest.nextDate || pet.nextVaccine || '')
      setPrice(latest.amount ? String(latest.amount) : '')
      return
    }
    setName('')
    setApplied(todayISO())
    setPaidOn(todayISO())
    setNext(pet.nextVaccine || '')
    setPrice('')
  }, [latest?.id, latest?.transactionId, open, pet?.id])

  if (!pet) return null

  return (
    <Sheet open={open} title={latest ? `Editar vacuna de ${pet.name}` : `Vacuna de ${pet.name}`} onClose={onClose}>
      <Field label="Nombre de la vacuna" placeholder="Antirrábica, triple felina..." value={name} onChangeText={setName} />
      <DatePickerField label="Fecha aplicada" value={applied} onChange={setApplied} presets={datePresets('shot')} />
      <DatePickerField
        label="Próxima dosis"
        value={next}
        onChange={setNext}
        optional
        presets={datePresets('nextShot')}
      />
      <Field label={`Costo (${currency})`} keyboardType="numeric" value={price} onChangeText={setPrice} />
      <DatePickerField label="Cuándo se pagó" value={paidOn} onChange={setPaidOn} presets={datePresets('event')} />
      <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular }}>
        {next
          ? `La próxima dosis sale como aviso el ${shortDate(next)}. El costo se descuenta el día en que se pagó.`
          : 'La fecha aplicada queda en la ficha. El costo se descuenta en el mes en que se pagó.'}
      </Text>
      <Button
        title={latest ? 'Guardar cambios' : 'Guardar vacuna'}
        onPress={() => {
          if (!next && name.trim().length < 2) {
            toast.push('Escribe la vacuna o la próxima fecha')
            return
          }
          const amount = Number(price)
          const payload = {
            kind: 'vacuna' as const,
            note: name,
            date: applied || todayISO(),
            amount: amount > 0 ? amount : null,
            nextDate: next || null,
            paidOn: amount > 0 ? paidOn || todayISO() : null,
            petIds: [pet.id],
          }
          if (latest) updatePetCare(latest.id, payload)
          else addPetCare(pet.id, payload)
          onClose()
          const spent = amount > 0 ? ` Pagado el ${shortDate(paidOn)}, en ${monthTitle(monthKey(paidOn))}.` : ''
          toast.push(
            next
              ? `Aviso el ${shortDate(next)}.${spent}`
              : amount > 0
                ? `Vacuna registrada.${spent}`
                : 'Vacuna actualizada',
          )
        }}
      />
    </Sheet>
  )
}
