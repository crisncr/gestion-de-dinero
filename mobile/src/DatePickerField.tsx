import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { useSheetScroll } from './ui'
import { addDays, addMonths, longDate, monthKey, monthTitle, todayISO } from './lib/format'
import { colors, fonts } from './theme'

const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

type Preset = { label: string; value: string }

export function DatePickerField({
  label,
  value,
  onChange,
  optional,
  presets,
}: {
  label: string
  value: string
  onChange: (iso: string) => void
  optional?: boolean
  presets?: Preset[]
}) {
  const [open, setOpen] = useState(false)
  const selected = value || todayISO()
  const [cursor, setCursor] = useState(selected.slice(0, 7))
  const box = useRef<View>(null)
  const sheetScroll = useSheetScroll()

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => sheetScroll?.reveal(box.current), 420)
    return () => clearTimeout(timer)
  }, [open, sheetScroll])

  const days = useMemo(() => buildMonth(cursor), [cursor])

  return (
    <View ref={box} style={{ gap: 8 }}>
      <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.semibold }}>{label}</Text>
      <Pressable
        onPress={() => {
          Keyboard.dismiss()
          setCursor((value || todayISO()).slice(0, 7))
          setOpen((current) => !current)
        }}
        style={{
          minHeight: 54,
          borderRadius: 16,
          backgroundColor: colors.lift,
          paddingHorizontal: 14,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: value ? colors.cream : colors.mute, fontFamily: fonts.semibold, fontSize: 15 }}>
          {value ? longDate(value) : 'Elegir en el calendario'}
        </Text>
      </Pressable>
      {presets && presets.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {presets.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => {
                onChange(item.value)
                setOpen(false)
              }}
              style={{
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: value === item.value ? 'rgba(85,214,160,0.12)' : colors.lift,
              }}
            >
              <Text style={{ color: value === item.value ? colors.mint : colors.mute, fontFamily: fonts.semibold, fontSize: 12 }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {open ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Pressable onPress={() => setCursor(shiftMonth(cursor, -1))} hitSlop={10}>
              <ChevronLeft color={colors.cream} size={20} />
            </Pressable>
            <Text style={{ color: colors.cream, fontFamily: fonts.bold, textTransform: 'capitalize' }}>
              {monthTitle(cursor)}
            </Text>
            <Pressable onPress={() => setCursor(shiftMonth(cursor, 1))} hitSlop={10}>
              <ChevronRight color={colors.cream} size={20} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {weekdays.map((day, index) => (
              <Text key={`${day}-${index}`} style={{ flex: 1, textAlign: 'center', color: colors.mute, fontSize: 11, fontFamily: fonts.semibold }}>
                {day}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {days.map((day) => {
              const active = day.iso === value
              const today = day.iso === todayISO()
              return (
                <Pressable
                  key={day.iso + String(day.outside)}
                  onPress={() => {
                    onChange(day.iso)
                    setOpen(false)
                  }}
                  style={{
                    width: '14.28%',
                    height: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
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
                        color: active ? colors.ink : day.outside ? colors.line : today ? colors.mint : colors.cream,
                        fontFamily: fonts.semibold,
                        fontSize: 13,
                      }}
                    >
                      {day.n}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
          {optional ? (
            <Pressable onPress={() => { onChange(''); setOpen(false) }} style={{ alignSelf: 'center', marginTop: 8 }}>
              <Text style={{ color: colors.mute, fontFamily: fonts.semibold }}>Quitar fecha</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

export function datePresets(kind: 'refill' | 'shot' | 'nextShot' | 'event') {
  const today = todayISO()
  if (kind === 'refill') {
    return [
      { label: 'Hoy', value: today },
      { label: '15 días', value: addDays(today, 15) },
      { label: '30 días', value: addDays(today, 30) },
      { label: '45 días', value: addDays(today, 45) },
    ]
  }
  if (kind === 'shot') {
    return [{ label: 'Hoy', value: today }, { label: 'Ayer', value: addDays(today, -1) }]
  }
  if (kind === 'nextShot') {
    return [
      { label: '1 mes', value: addMonths(today, 1) },
      { label: '3 meses', value: addMonths(today, 3) },
      { label: '1 año', value: addMonths(today, 12) },
    ]
  }
  return [
    { label: 'Hoy', value: today },
    { label: 'Mañana', value: addDays(today, 1) },
    { label: 'En 7 días', value: addDays(today, 7) },
  ]
}

function shiftMonth(key: string, delta: number) {
  return monthKey(addMonths(`${key}-01`, delta))
}

function buildMonth(key: string) {
  const [year, month] = key.split('-').map(Number)
  const first = new Date(year, (month ?? 1) - 1, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(1 - startOffset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return {
      iso,
      n: date.getDate(),
      outside: date.getMonth() !== first.getMonth(),
    }
  })
}
