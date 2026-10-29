import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { monthTitle, shiftMonth } from './lib/format'
import { colors, fonts } from './theme'

export function MonthBar({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
      <Pressable onPress={() => onChange(shiftMonth(value, -1))} hitSlop={12}>
        <ChevronLeft color={colors.cream} size={22} />
      </Pressable>
      <Text style={{ color: colors.cream, fontFamily: fonts.bold, textTransform: 'capitalize', fontSize: 16 }}>
        {monthTitle(value)}
      </Text>
      <Pressable onPress={() => onChange(shiftMonth(value, 1))} hitSlop={12}>
        <ChevronRight color={colors.cream} size={22} />
      </Pressable>
    </View>
  )
}
