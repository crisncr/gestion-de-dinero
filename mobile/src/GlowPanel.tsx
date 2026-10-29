import type { ReactNode } from 'react'
import { View, type ViewStyle } from 'react-native'
import { colors, radius } from './theme'

export function GlowPanel({
  children,
  style,
  accent = colors.mint,
}: {
  children: ReactNode
  style?: ViewStyle
  accent?: string
}) {
  return (
    <View
      style={[
        {
          backgroundColor: '#0A0C0B',
          borderRadius: radius.card,
          padding: 20,
          borderWidth: 1,
          borderColor: `${accent}33`,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: accent,
          opacity: 0.1,
          top: -86,
          right: -54,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: accent,
          opacity: 0.06,
          bottom: -40,
          left: -28,
        }}
      />
      {children}
    </View>
  )
}
