import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BackHeader } from '../src/BackHeader'
import { DatePickerField, datePresets } from '../src/DatePickerField'
import { MonthFilterSheet, pickedLabel } from '../src/MonthFilterSheet'
import { Screen } from '../src/Screen'
import { longDate, monthKey, monthTitle, todayISO } from '../src/lib/format'
import { eventTone, useStore } from '../src/store/StoreProvider'
import { colors, fonts } from '../src/theme'
import type { EventKind } from '../src/types'
import { Button, Card, Empty, Field, Sheet, useToast } from '../src/ui'

export default function NotificationsScreen() {
  const { stats, addEvent } = useStore()
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState<string | null>(null)
  const [filterDay, setFilterDay] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  const items = useMemo(
    () =>
      [...stats.upcoming]
        .filter((item) => (filterDay ? item.date === filterDay : filterMonth ? item.date.startsWith(filterMonth) : true))
        .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
    [filterDay, filterMonth, stats.upcoming],
  )

  return (
    <Screen>
      <BackHeader
        title="Avisos"
        action={<Button title="+ Aviso" size="sm" onPress={() => setOpen(true)} />}
      />
      <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>
        {filterMonth || filterDay ? `Mostrando ${pickedLabel(filterMonth, filterDay)}.` : 'Estos son tus recordatorios, cada uno con su fecha.'}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => setFilterOpen(true)}>
          <Text style={{ color: colors.mint, fontFamily: fonts.semibold }}>Ver avisos por fecha</Text>
        </Pressable>
        {filterMonth || filterDay ? (
          <Pressable onPress={() => { setFilterMonth(null); setFilterDay(null) }}>
            <Text style={{ color: colors.mute, fontFamily: fonts.semibold }}>Ver todos</Text>
          </Pressable>
        ) : null}
      </View>
      <Card>
        {items.length === 0 ? (
          <Empty
            title="Sin avisos"
            text={filterMonth || filterDay ? 'En esa fecha no hay avisos.' : 'Crea un aviso o registra la próxima vacuna, la comida o una tarea con fecha.'}
          />
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
      <Sheet
        open={open}
        title="Nuevo aviso"
        subtitle="Un recordatorio de fecha. Si hay que hacerlo y tacharlo, crea una tarea."
        onClose={() => setOpen(false)}
      >
        <Field label="De qué quieres acordarte" placeholder="Pago de luz, supermercado..." value={title} onChangeText={setTitle} />
        <DatePickerField label="Cuándo" value={date} onChange={setDate} presets={datePresets('event')} />
        <Button
          title="Guardar aviso"
          onPress={() => {
            if (title.trim().length < 2) {
              toast.push('Escribe un título')
              return
            }
            addEvent({ title, date, kind: 'other' as EventKind, note: '' })
            setTitle('')
            setDate(todayISO())
            setOpen(false)
            toast.push('Aviso creado')
          }}
        />
      </Sheet>
      <MonthFilterSheet
        open={filterOpen}
        title="Ver avisos por fecha"
        initialMonth={filterMonth || monthKey()}
        onClose={() => setFilterOpen(false)}
        onAccept={(month, day) => {
          setFilterMonth(month)
          setFilterDay(day)
        }}
      />
    </Screen>
  )
}
