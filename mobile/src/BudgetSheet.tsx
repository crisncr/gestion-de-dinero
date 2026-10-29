import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { CurrencyPicker } from './CurrencyPicker'
import { getCurrency } from './data/currencies'
import { useStore } from './store/StoreProvider'
import { colors, fonts } from './theme'
import { Button, Sheet, useToast } from './ui'

export function BudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { household, canManage, updateHousehold } = useStore()
  const toast = useToast()
  const [currency, setCurrency] = useState(household?.currency ?? 'CLP')

  useEffect(() => {
    if (!open) return
    setCurrency(household?.currency ?? 'CLP')
  }, [household?.currency, open])

  const meta = getCurrency(currency)

  return (
    <Sheet open={open} title="Moneda del hogar" onClose={onClose}>
      <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.regular }}>
        Elige cómo se ven los montos. El sueldo no se guarda aquí: se registra cada mes en Ingreso.
      </Text>
      <CurrencyPicker value={currency} onChange={setCurrency} />
      {canManage ? (
        <Button
          title="Guardar moneda"
          onPress={() => {
            try {
              updateHousehold({ currency })
              toast.push(`Montos en ${meta.country} (${meta.code})`)
              onClose()
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'Sin permiso')
            }
          }}
        />
      ) : (
        <Button title="Solo el titular puede cambiarla" variant="secondary" onPress={onClose} />
      )}
    </Sheet>
  )
}
