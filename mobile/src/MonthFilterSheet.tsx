import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { monthTitle, parseISO, shiftMonth, todayISO } from './lib/format'
import { colors, fonts } from './theme'
import { Button, Sheet } from './ui'

const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function monthMatrix(key: string) {
  const [year, month] = key.split('-').map(Number)
  const first = new Date(year, (month ?? 1) - 1, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, (month ?? 1) - 1, 1 - startOffset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return { iso, day: date.getDate(), inMonth: date.getMonth() === first.getMonth() }
  })
}

export function MonthFilterSheet({
  open,
  title,
  initialMonth,
  onClose,
  onAccept,
}: {
  open: boolean
  title: string
  initialMonth: string
  onClose: () => void
  onAccept: (month: string, day: string | null) => void
}) {
  const [month, setMonth] = useState(initialMonth)
  const [day, setDay] = useState<string | null>(null)
  const days = useMemo(() => monthMatrix(month), [month])
  const today = todayISO()

  useEffect(() => {
    if (!open) return
    setMonth(initialMonth)
    setDay(null)
  }, [initialMonth, open])

  return (
    <Sheet
      open={open}
      title={title}
      subtitle="Cambia de mes. Si tocas un día, al aceptar solo queda esa fecha."
      onClose={onClose}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => { setMonth((value) => shiftMonth(value, -1)); setDay(null) }} hitSlop={10}>
          <Text style={{ color: colors.mute, fontFamily: fonts.semibold }}>Anterior</Text>
        </Pressable>
        <Text style={{ color: colors.cream, fontFamily: fonts.bold, textTransform: 'capitalize' }}>{monthTitle(month)}</Text>
        <Pressable onPress={() => { setMonth((value) => shiftMonth(value, 1)); setDay(null) }} hitSlop={10}>
          <Text style={{ color: colors.mute, fontFamily: fonts.semibold }}>Siguiente</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {week.map((label, index) => (
          <Text key={`${label}-${index}`} style={{ flex: 1, textAlign: 'center', color: colors.mute, fontSize: 11, fontFamily: fonts.semibold }}>
            {label}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.map((cell) => {
          const active = cell.iso === day
          return (
            <Pressable
              key={cell.iso}
              onPress={() => {
                if (!cell.inMonth) {
                  setMonth(cell.iso.slice(0, 7))
                  setDay(cell.iso)
                  return
                }
                setDay((current) => (current === cell.iso ? null : cell.iso))
              }}
              style={{ width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? colors.mint : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: active ? colors.ink : cell.inMonth ? cell.iso === today ? colors.mint : colors.cream : '#555',
                    fontFamily: fonts.semibold,
                    fontSize: 13,
                  }}
                >
                  {cell.day}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
      <Button
        title="Aceptar"
        onPress={() => {
          onAccept(day ? day.slice(0, 7) : month, day)
          onClose()
        }}
      />
    </Sheet>
  )
}

export function pickedLabel(month: string | null, day: string | null) {
  if (day) return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' }).format(parseISO(day))
  if (month) return monthTitle(month)
  return ''
}
