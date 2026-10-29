import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BackHeader } from '../src/BackHeader'
import { Screen } from '../src/Screen'
import { longDate, parseISO, todayISO } from '../src/lib/format'
import { collectReminders, reminderDates, remindersForDay } from '../src/lib/reminders'
import { useStore } from '../src/store/StoreProvider'
import { colors, fonts } from '../src/theme'
import type { EventKind } from '../src/types'
import { Button, Card, Field, Sheet, useToast } from '../src/ui'

const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { iso, inMonth: d.getMonth() === month, day: d.getDate() }
  })
}

export default function CalendarScreen() {
  const { household, state, addEvent, removeEvent } = useStore()
  const toast = useToast()
  const today = todayISO()
  const initial = parseISO(today)
  const [cursor, setCursor] = useState({ y: initial.getFullYear(), m: initial.getMonth() })
  const [selected, setSelected] = useState(today)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const days = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor])
  const reminders = useMemo(
    () => (household ? collectReminders(state, household.id) : []),
    [household?.id, state],
  )
  const marked = useMemo(() => reminderDates(reminders), [reminders])
  const events = state.events.filter((e) => e.householdId === household?.id && e.date === selected)
  const extras = remindersForDay(reminders, selected).filter((item) => !item.id.startsWith('event-'))
  const titleMonth = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date(cursor.y, cursor.m, 1))

  return (
    <Screen>
      <BackHeader title="Calendario" action={<Button title="+ Aviso" onPress={() => setOpen(true)} />} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable onPress={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}>
            <Text style={{ color: colors.mute }}>Anterior</Text>
          </Pressable>
          <Text style={{ color: colors.cream, fontWeight: '700', textTransform: 'capitalize' }}>{titleMonth}</Text>
          <Pressable onPress={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}>
            <Text style={{ color: colors.mute }}>Siguiente</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {week.map((d, i) => (
            <Text key={`${d}-${i}`} style={{ flex: 1, textAlign: 'center', color: colors.mute, fontSize: 11 }}>{d}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {days.map((cell) => {
            const selectedDay = cell.iso === selected
            const hasAviso = marked.has(cell.iso)
            return (
              <Pressable
                key={cell.iso}
                onPress={() => setSelected(cell.iso)}
                style={{
                  width: '14.28%',
                  height: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  backgroundColor: selectedDay ? colors.mint : 'transparent',
                }}
              >
                <Text style={{ color: selectedDay ? colors.ink : cell.inMonth ? colors.cream : '#555', fontWeight: selectedDay ? '700' : '400' }}>
                  {cell.day}
                </Text>
                {hasAviso ? (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      marginTop: 2,
                      backgroundColor: selectedDay ? colors.ink : colors.mint,
                    }}
                  />
                ) : (
                  <View style={{ width: 5, height: 5, marginTop: 2 }} />
                )}
              </Pressable>
            )
          })}
        </View>
      </Card>
      <Card>
        <Text style={{ color: colors.cream, fontWeight: '700', textTransform: 'capitalize' }}>{longDate(selected)}</Text>
        {events.length === 0 && extras.length === 0 ? (
          <Text style={{ color: colors.mute, marginTop: 10 }}>No hay acontecimientos este día.</Text>
        ) : (
          <>
            {events.map((event) => (
              <View key={event.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.cream }}>{event.title}</Text>
                <Pressable onPress={() => removeEvent(event.id)}><Text style={{ color: colors.danger }}>Quitar</Text></Pressable>
              </View>
            ))}
            {extras.map((item) => (
              <View key={item.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
                <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{item.title}</Text>
                <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>
                  {item.meta}
                </Text>
              </View>
            ))}
          </>
        )}
      </Card>
      <Sheet open={open} title="Nuevo recordatorio" onClose={() => setOpen(false)}>
        <Field label="Título" value={title} onChangeText={setTitle} />
        <Button
          title="Guardar"
          onPress={() => {
            if (title.trim().length < 2) return toast.push('Escribe un título')
            addEvent({ title, date: selected, kind: 'other' as EventKind, note: '' })
            setTitle('')
            setOpen(false)
            toast.push('Aviso creado en ese día')
          }}
        />
      </Sheet>
    </Screen>
  )
}
