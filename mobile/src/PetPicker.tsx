import { Pressable, Text, View } from 'react-native'
import { colors, fonts } from './theme'
import type { Pet } from './types'

export function PetPicker({
  pets,
  value,
  onChange,
  label = 'Para qué mascotas',
}: {
  pets: Pet[]
  value: string[]
  onChange: (ids: string[]) => void
  label?: string
}) {
  if (pets.length === 0) return null

  const toggle = (id: string) => {
    if (value.includes(id)) {
      if (value.length === 1) return
      onChange(value.filter((item) => item !== id))
      return
    }
    onChange([...value, id])
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.semibold }}>{label}</Text>
        {pets.length > 1 ? (
          <Pressable onPress={() => onChange(pets.map((pet) => pet.id))}>
            <Text style={{ color: colors.mint, fontFamily: fonts.semibold, fontSize: 12 }}>Todas</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {pets.map((pet) => {
          const active = value.includes(pet.id)
          return (
            <Pressable
              key={pet.id}
              onPress={() => toggle(pet.id)}
              style={{
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: active ? 'rgba(85,214,160,0.12)' : colors.lift,
                borderWidth: 1,
                borderColor: active ? 'rgba(85,214,160,0.45)' : 'transparent',
              }}
            >
              <Text style={{ color: active ? colors.mint : colors.cream, fontFamily: fonts.semibold, fontSize: 13 }}>
                {pet.name}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {value.length > 1 ? (
        <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 8 }}>
          Un solo saco o producto, visible en las {value.length} mascotas. El gasto se cuenta una vez.
        </Text>
      ) : null}
    </View>
  )
}
