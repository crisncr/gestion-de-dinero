import { Pressable, Text, View } from 'react-native'
import { colors, fonts } from './theme'

export function CategoryPicker({
  options,
  value,
  onChange,
}: {
  options: readonly { id: string; label: string; accent?: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <View>
      <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.semibold, marginBottom: 10 }}>
        Tipo
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((item) => {
          const active = value === item.id
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              style={{
                minWidth: '47%',
                flexGrow: 1,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: active ? 'rgba(85,214,160,0.45)' : colors.line,
                backgroundColor: active ? 'rgba(85,214,160,0.10)' : colors.lift,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: item.accent ?? (active ? colors.mint : colors.mute),
                }}
              />
              <Text
                style={{
                  color: active ? colors.cream : colors.mute,
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
