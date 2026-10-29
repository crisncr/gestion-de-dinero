import { Text, View } from 'react-native'
import { colors, fonts } from './theme'
import { Field } from './ui'

export function BirthDateFields({
  day,
  month,
  year,
  error,
  onChange,
}: {
  day: string
  month: string
  year: string
  error?: string
  onChange: (next: { day: string; month: string; year: string }) => void
}) {
  const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max)
  return (
    <View>
      <Text style={{ color: colors.cream, fontFamily: fonts.semibold, marginBottom: 12 }}>
        Fecha de nacimiento
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Día"
            keyboardType="number-pad"
            maxLength={2}
            placeholder="15"
            value={day}
            onChangeText={(value) => onChange({ day: digits(value, 2), month, year })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Mes"
            keyboardType="number-pad"
            maxLength={2}
            placeholder="03"
            value={month}
            onChangeText={(value) => onChange({ day, month: digits(value, 2), year })}
          />
        </View>
        <View style={{ flex: 1.3 }}>
          <Field
            label="Año"
            keyboardType="number-pad"
            maxLength={4}
            placeholder="1990"
            value={year}
            onChangeText={(value) => onChange({ day, month, year: digits(value, 4) })}
          />
        </View>
      </View>
      {error ? (
        <Text style={{ color: colors.danger, fontFamily: fonts.semibold, fontSize: 13, marginTop: 8 }}>
          {error}
        </Text>
      ) : (
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 13, marginTop: 8 }}>
          Casa360 es solo para mayores de 18 años.
        </Text>
      )}
    </View>
  )
}
