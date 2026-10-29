import { Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { colors, fonts } from './theme'

type Slice = { pct: number; color: string }

export function SpendRing({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: Slice[]
  centerLabel: string
  centerValue: string
}) {
  const size = 196
  const stroke = 16
  const cx = size / 2
  const cy = size / 2
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let acc = 0
  const visible = slices.filter((slice) => slice.pct > 0.6)

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.lift} strokeWidth={stroke} fill="none" />
        {visible.map((slice, index) => {
          const len = (slice.pct / 100) * circ
          const offset = acc
          acc += len
          return (
            <Circle
              key={`${slice.color}-${index}`}
              cx={cx}
              cy={cy}
              r={r}
              stroke={slice.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          )
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', width: 128 }}>
        <Text style={{ color: colors.mute, fontSize: 11, fontFamily: fonts.regular }}>{centerLabel}</Text>
        <Text style={{ color: colors.cream, fontSize: 22, fontFamily: fonts.extra, marginTop: 4, textAlign: 'center' }}>
          {centerValue}
        </Text>
      </View>
    </View>
  )
}
