import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BackHeader } from '../src/BackHeader'
import { MonthBar } from '../src/MonthBar'
import { Screen } from '../src/Screen'
import { monthKey, shortDate } from '../src/lib/format'
import { collectReminders } from '../src/lib/reminders'
import { eventTone, useStore } from '../src/store/StoreProvider'
import { colors } from '../src/theme'
import { Card, Empty } from '../src/ui'

export default function NotificationsScreen() {
  const { household, state } = useStore()
  const router = useRouter()
  const [month, setMonth] = useState(monthKey())
  const items = useMemo(
    () =>
      (household ? collectReminders(state, household.id) : []).filter((item) => item.date.startsWith(month)),
    [household, month, state],
  )
  return (
    <Screen>
      <BackHeader title="Avisos" />
      <MonthBar value={month} onChange={setMonth} />
      <Card>
        {items.length === 0 ? (
          <Empty title="Sin avisos este mes" text="Vacunas, compras de mascota, tareas y recordatorios aparecen en el mes de su fecha." />
        ) : (
          items.map((item) => {
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
