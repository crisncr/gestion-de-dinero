import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BackHeader } from '../src/BackHeader'
import { Screen } from '../src/Screen'
import { longDate, monthKey, monthTitle } from '../src/lib/format'
import { eventTone, useStore } from '../src/store/StoreProvider'
import { colors, fonts } from '../src/theme'
import { Card, Empty } from '../src/ui'

export default function NotificationsScreen() {
  const { stats } = useStore()
  const router = useRouter()
  const items = useMemo(
    () => [...stats.upcoming].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
    [stats.upcoming],
  )

  return (
    <Screen>
      <BackHeader title="Avisos" />
      <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>
        Están todos juntos. Cada uno dice el día, sin cambiar de mes.
      </Text>
      <Card>
        {items.length === 0 ? (
          <Empty title="Sin avisos" text="Cuando programes una vacuna, una tarea o un recordatorio, aparece aquí con su fecha." />
        ) : (
          items.map((item, index) => {
            const tone = eventTone(item.date)
            const month = monthKey(item.date)
            const showMonth = index === 0 || monthKey(items[index - 1].date) !== month
            return (
              <View key={item.id}>
                {showMonth ? (
                  <Text
                    style={{
                      color: colors.cream,
                      fontFamily: fonts.bold,
                      textTransform: 'capitalize',
                      marginTop: index === 0 ? 4 : 18,
                      marginBottom: 4,
                    }}
                  >
                    {monthTitle(month)}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => router.push(item.href as never)}
                  style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }}
                >
                  <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{item.title}</Text>
                  <Text
                    style={{
                      color: tone === 'overdue' ? colors.danger : tone === 'soon' ? colors.warn : colors.mint,
                      fontFamily: fonts.semibold,
                      fontSize: 13,
                      marginTop: 4,
                      textTransform: 'capitalize',
                    }}
                  >
                    {longDate(item.date)}
                  </Text>
                  <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>{item.meta}</Text>
                </Pressable>
              </View>
            )
          })
        )}
      </Card>
    </Screen>
  )
}
