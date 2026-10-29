import { Banknote, Pencil } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { CategoryPicker } from './CategoryPicker'
import { DatePickerField, datePresets } from './DatePickerField'
import { expenseCategories, incomeCategories } from './data/catalog'
import { todayISO } from './lib/format'
import { useStore } from './store/StoreProvider'
import { colors, fonts } from './theme'
import type { TxType } from './types'
import { Button, Chip, Field, Sheet, useToast } from './ui'

export function TransactionSheet({
  open,
  initialType = 'expense',
  onClose,
}: {
  open: boolean
  initialType?: TxType
  onClose: () => void
}) {
  const { addTransaction, members, membership } = useStore()
  const toast = useToast()
  const [type, setType] = useState<TxType>(initialType)
  const [category, setCategory] = useState('alimentacion')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [memberId, setMemberId] = useState(membership?.id ?? '')

  useEffect(() => {
    if (!open) return
    setType(initialType)
    setCategory(initialType === 'income' ? 'sueldo' : 'alimentacion')
    setAmount('')
    setNote('')
    setDate(todayISO())
    setMemberId(membership?.id ?? '')
  }, [initialType, membership?.id, open])

  const cats = type === 'income' ? incomeCategories : expenseCategories

  return (
    <Sheet open={open} title={type === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto'} onClose={onClose}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          label="Gasto"
          active={type === 'expense'}
          onPress={() => {
            setType('expense')
            setCategory('alimentacion')
          }}
        />
        <Chip
          label="Ingreso"
          active={type === 'income'}
          onPress={() => {
            setType('income')
            setCategory('sueldo')
          }}
        />
      </View>
      {type === 'income' ? (
        <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular }}>
          El sueldo y los aportes cambian cada mes. Registra el de este mes y entra a la cartera.
        </Text>
      ) : null}
      <CategoryPicker options={cats} value={category} onChange={setCategory} />
      {type === 'income' && members.length > 0 ? (
        <View>
          <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.semibold, marginBottom: 10 }}>
            Quién aportó
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {members.map((member) => (
              <Chip
                key={member.id}
                label={member.name}
                active={memberId === member.id}
                onPress={() => setMemberId(member.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <Field
        label="Monto"
        icon={Banknote}
        keyboardType="numeric"
        placeholder="450000"
        value={amount}
        onChangeText={setAmount}
      />
      <Field
        label={type === 'expense' ? 'Qué compraste o pagaste' : 'Detalle (opcional)'}
        icon={Pencil}
        placeholder={type === 'expense' ? 'Supermercado, luz, bencina...' : 'Sueldo octubre, extra de Juan...'}
        value={note}
        onChangeText={setNote}
      />
      <DatePickerField label="Fecha" value={date} onChange={setDate} presets={datePresets('event')} />
      <Button
        title="Guardar"
        onPress={() => {
          const value = Number(amount)
          if (!value) {
            toast.push('Ingresa un monto válido')
            return
          }
          addTransaction({
            type,
            amount: value,
            category,
            description: note,
            date,
            memberId: type === 'income' ? memberId : undefined,
          })
          onClose()
          toast.push(type === 'expense' ? 'Gasto descontado de la cartera' : 'Ingreso sumado a la cartera')
        }}
      />
    </Sheet>
  )
}
