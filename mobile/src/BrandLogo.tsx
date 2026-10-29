import { Image, Text, View } from 'react-native'
import { colors, fonts } from './theme'

export function BrandLogo({
  size = 72,
  showName = true,
  layout = 'stack',
}: {
  size?: number
  showName?: boolean
  layout?: 'stack' | 'row'
}) {
  const row = layout === 'row'
  return (
    <View style={{ alignItems: 'center', flexDirection: row ? 'row' : 'column', gap: row ? 10 : 0 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          overflow: 'hidden',
          backgroundColor: '#050505',
        }}
      >
        <Image
          source={require('../assets/images/icon.png')}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
      {showName ? (
        <Text
          style={{
            color: colors.cream,
            fontSize: row ? 18 : size >= 80 ? 22 : 17,
            fontFamily: fonts.extra,
            marginTop: row ? 0 : 8,
            letterSpacing: 0.2,
          }}
        >
          Casa<Text style={{ color: colors.mint }}>360</Text>
        </Text>
      ) : null}
    </View>
  )
}
