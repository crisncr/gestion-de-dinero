import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { BackHeader } from '../src/BackHeader'
import { Screen } from '../src/Screen'
import { longDate } from '../src/lib/format'
import { eventTone, useStore } from '../src/store/StoreProvider'
import { colors, fonts } from '../src/theme'
import { Card, Empty } from '../src/ui'

export default function AlertsScreen() {
  const { stats } = useStore()
  const router = useRouter()
  return (
    <Screen>
      <BackHeader title="Notificaciones" />
      <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>
        Aquí avisa la app: una compra, un pago atrasado, una vacuna o que se acaba la comida o la arena.
      </Text>
      <Card>
        {stats.notifications.length === 0 ? (
          <Empty title="Sin notificaciones" text="Cuando compres, se atrase un pago o se acerque la fecha de la comida, la arena o la vacuna, aparece aquí." />
        ) : (
          stats.notifications.map((item) => {
            const tone = eventTone(item.date)
            return (
              <Pressable
                key={item.id}
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
            )
          })
        )}
      </Card>
    </Screen>
  )
}
