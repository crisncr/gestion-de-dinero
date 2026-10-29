import { ChevronDown } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { currencies, getCurrency } from './data/currencies'
import { colors, fonts } from './theme'

export function CurrencyPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (code: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = getCurrency(value)

  return (
    <View>
      <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.semibold, marginBottom: 8 }}>
        Moneda del país
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          minHeight: 54,
          borderRadius: 16,
          backgroundColor: colors.lift,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ color: colors.cream, fontFamily: fonts.semibold, fontSize: 15 }}>
            {selected.country}
          </Text>
          <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 }}>
            {selected.code} · {selected.symbol}
          </Text>
        </View>
        <ChevronDown size={18} color={colors.mute} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 14,
              paddingBottom: 28,
              maxHeight: '70%',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
            </View>
            <Text
              style={{
                color: colors.cream,
                fontFamily: fonts.bold,
                fontSize: 17,
                paddingHorizontal: 18,
                marginBottom: 8,
              }}
            >
              Elige la moneda
            </Text>
            <ScrollView>
              {currencies.map((item) => {
                const active = value === item.code
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      onChange(item.code)
                      setOpen(false)
                    }}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: active ? 'rgba(85,214,160,0.08)' : 'transparent',
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{item.country}</Text>
                      <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                        {item.code} · {item.symbol}
                      </Text>
                    </View>
                    {active ? (
                      <Text style={{ color: colors.mint, fontFamily: fonts.semibold, fontSize: 12 }}>Elegida</Text>
                    ) : null}
                  </Pressable>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}
