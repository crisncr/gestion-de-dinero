import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { BackHeader } from '../src/BackHeader'
import { Screen } from '../src/Screen'
import { shortDate } from '../src/lib/format'
import { eventTone, useStore } from '../src/store/StoreProvider'
import { colors } from '../src/theme'
import { Card, Empty } from '../src/ui'

export default function NotificationsScreen() {
  const { stats } = useStore()
  const router = useRouter()
  return (
    <Screen>
      <BackHeader title="Avisos" />
      <Card>
        {stats.upcoming.length === 0 ? (
          <Empty title="Sin avisos" text="Cuando programes comida, arena, vacuna, tarea o un recordatorio, aparecen aquí." />
        ) : (
          stats.upcoming.map((item) => {
            const tone = eventTone(item.date)
            return (
              <Pressable key={item.id} onPress={() => router.push(item.href as never)} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.cream, fontWeight: '600' }}>{item.title}</Text>
                  <Text style={{ color: colors.mute, fontSize: 12 }}>{item.meta}</Text>
                </View>
                <Text style={{ color: tone === 'overdue' ? colors.danger : tone === 'soon' ? colors.warn : colors.mute }}>
                  {shortDate(item.date)}
                </Text>
              </Pressable>
            )
          })
        )}
      </Card>
    </Screen>
  )
}
