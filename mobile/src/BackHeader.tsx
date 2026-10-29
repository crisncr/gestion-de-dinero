import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { colors, fonts } from './theme'

export function BackHeader({ title, action, onBack }: { title: string; action?: ReactNode; onBack?: () => void }) {
  const router = useRouter()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable onPress={() => (onBack ? onBack() : router.back())} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ChevronLeft color={colors.mute} />
        <Text style={{ color: colors.cream, fontSize: 22, fontFamily: fonts.bold }}>{title}</Text>
      </Pressable>
      {action}
    </View>
  )
}
