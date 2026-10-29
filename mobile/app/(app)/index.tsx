import { useRouter } from 'expo-router'
import { Bell, CalendarDays, ListTodo, PawPrint, Plus, ShoppingBasket, Wallet } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { DatePickerField, datePresets } from '../../src/DatePickerField'
import { GlowPanel } from '../../src/GlowPanel'
import { Screen } from '../../src/Screen'
import { TransactionSheet } from '../../src/TransactionSheet'
import { currencyCaption } from '../../src/data/currencies'
import { longDate, money, monthKey, monthTitle, shortDate, todayISO } from '../../src/lib/format'
import { eventTone, useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import type { EventKind, TxType } from '../../src/types'
import { BrandLogo } from '../../src/BrandLogo'
import { Avatar, Button, Field, Progress, Sheet, useToast } from '../../src/ui'

function greeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function HomeScreen() {
  const router = useRouter()
  const toast = useToast()
  const { currentUser, household, stats, state, addEvent, refresh } = useStore()
  const currency = household?.currency ?? 'CLP'
  const [txOpen, setTxOpen] = useState(false)
  const [txType, setTxType] = useState<TxType>('expense')
  const [eventOpen, setEventOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState(todayISO())

  const openTx = (type: TxType) => {
    setTxType(type)
    setTxOpen(true)
  }

  const pendingTasks = state.tasks.filter((task) => task.householdId === household?.id && !task.done).length
  const petsCount = state.pets.filter((pet) => pet.householdId === household?.id).length

  const actions = useMemo(
    () => [
      {
        label: 'Compras',
        text: stats.pendingShopping ? `${stats.pendingShopping} en lista` : 'Lista del hogar',
        icon: ShoppingBasket,
        color: '#55D6A0',
        onPress: () => router.push('/(app)/compras'),
      },
      {
        label: 'Gasto',
        text: 'Registrar ahora',
        icon: Wallet,
        color: '#E06A6A',
        onPress: () => openTx('expense'),
      },
      {
        label: 'Tareas',
        text: pendingTasks ? `${pendingTasks} pendientes` : 'Nada pendiente',
        icon: ListTodo,
        color: '#5B8CFF',
        onPress: () => router.push('/tareas'),
      },
      {
        label: 'Mascotas',
        text: petsCount ? `${petsCount} en casa` : 'Sin mascotas',
        icon: PawPrint,
        color: '#A78BFA',
        onPress: () => router.push('/mascotas'),
      },
      {
        label: 'Agenda',
        text: stats.upcoming.length ? `${stats.upcoming.length} avisos` : 'Calendario',
        icon: CalendarDays,
        color: '#E0B15A',
        onPress: () => router.push('/calendario'),
      },
      {
        label: 'Aviso',
        text: 'Nuevo recordatorio',
        icon: Bell,
        color: '#38BDF8',
        onPress: () => setEventOpen(true),
      },
    ],
    [pendingTasks, petsCount, router, stats.pendingShopping, stats.upcoming.length],
  )

  return (
    <Screen onRefresh={refresh}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <BrandLogo size={36} layout="row" />
          <Text style={{ color: colors.cream, fontSize: 26, fontFamily: fonts.extra, marginTop: 14 }} numberOfLines={2}>
            {greeting()}, {currentUser?.name}
          </Text>
          <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>
            {longDate(todayISO())}
            {household?.name ? ` · ${household.name}` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/notificaciones')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: '#121412',
              borderWidth: 1,
              borderColor: stats.upcoming.length ? 'rgba(85,214,160,0.35)' : colors.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={16} color={stats.upcoming.length ? colors.mint : colors.cream} />
            {stats.upcoming.length > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  minWidth: 14,
                  height: 14,
                  borderRadius: 7,
                  paddingHorizontal: 3,
                  backgroundColor: colors.mint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 8, fontFamily: fonts.bold }}>
                  {stats.upcoming.length > 9 ? '9+' : stats.upcoming.length}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => router.push('/ajustes')}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(85,214,160,0.28)',
              padding: 2,
            }}
          >
            <Avatar name={currentUser?.name ?? 'H'} size={40} />
          </Pressable>
        </View>
      </View>

      <GlowPanel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: 'rgba(85,214,160,0.8)', fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.6 }}>
              CARTERA VIVA
            </Text>
            <Text style={{ color: colors.mute, marginTop: 6, fontFamily: fonts.regular, fontSize: 13 }}>
              Lo que queda de {monthTitle(monthKey())}
            </Text>
          </View>
          <Pressable
            onPress={() => openTx('expense')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              backgroundColor: 'rgba(85,214,160,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(85,214,160,0.28)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={18} color={colors.mint} />
          </Pressable>
        </View>
        <Text style={{ color: colors.cream, fontSize: 42, fontFamily: fonts.extra, marginTop: 18, letterSpacing: -1 }}>
          {money(stats.remaining, currency)}
        </Text>
        <Text style={{ color: colors.mute, marginTop: 6, fontFamily: fonts.regular }}>
          {currencyCaption(currency)} · entró {money(stats.monthIncome, currency)} · salió {money(stats.monthExpenses, currency)}
        </Text>
        {stats.monthIncome === 0 ? (
          <Text style={{ color: colors.warn, marginTop: 12, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>
            Registra el sueldo o un aporte familiar de este mes para ver dinero en la cartera.
          </Text>
        ) : (
          <View style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular }}>Uso del mes</Text>
              <Text style={{ color: stats.usedPct >= 80 ? colors.warn : colors.mint, fontSize: 12, fontFamily: fonts.semibold }}>
                {Math.round(stats.usedPct)}%
              </Text>
            </View>
            <Progress value={stats.usedPct} />
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
          <View style={{ flex: 1 }}>
            <Button title="Ingreso" variant="secondary" onPress={() => openTx('income')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Gasto" onPress={() => openTx('expense')} />
          </View>
        </View>
      </GlowPanel>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: 'Ingresos', value: money(stats.monthIncome, currency), color: colors.mint, onPress: () => router.push('/(app)/finanzas') },
          { label: 'Gastos', value: money(stats.monthExpenses, currency), color: colors.cream, onPress: () => router.push('/(app)/finanzas') },
          { label: 'Sueldo', value: money(stats.monthSalary, currency), color: colors.mint, onPress: () => router.push('/(app)/finanzas') },
        ].map((item) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            style={{
              flex: 1,
              backgroundColor: '#101210',
              borderRadius: 20,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text style={{ color: colors.mute, fontSize: 10, fontFamily: fonts.semibold, letterSpacing: 0.6 }}>{item.label}</Text>
            <Text style={{ color: item.color, fontSize: 13, fontFamily: fonts.bold, marginTop: 8 }} numberOfLines={1}>
              {item.value}
            </Text>
          </Pressable>
        ))}
      </View>

      <View>
        <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 16, marginBottom: 10 }}>Módulos</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
          {actions.map((item) => {
            const Icon = item.icon
            return (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={{
                  width: '48.5%',
                  backgroundColor: '#101210',
                  borderRadius: 22,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: `${item.color}26`,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: `${item.color}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 14 }}>{item.label}</Text>
                  <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                    {item.text}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>

      <GlowPanel accent="#5B8CFF" style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View>
            <Text style={{ color: 'rgba(91,140,255,0.85)', fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.4 }}>
              SEÑAL
            </Text>
            <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 16, marginTop: 4 }}>Próximos</Text>
          </View>
          <Pressable onPress={() => router.push('/calendario')}>
            <Text style={{ color: colors.mint, fontFamily: fonts.semibold }}>Ver todos</Text>
          </Pressable>
        </View>
        {stats.upcoming.length === 0 ? (
          <Text style={{ color: colors.mute, paddingVertical: 16, fontFamily: fonts.regular, lineHeight: 20 }}>
            Aún no hay avisos. La fecha de comida, arena o vacuna aparece aquí.
          </Text>
        ) : (
          stats.upcoming.slice(0, 5).map((item) => {
            const tone = eventTone(item.date)
            const dot =
              item.kind === 'payment' ? colors.warn : item.kind === 'pet' ? '#A78BFA' : item.kind === 'shopping' ? colors.mint : '#5B8CFF'
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.href as never)}
                style={{ paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: `${dot}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: `${dot}33`,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>{item.title}</Text>
                  <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 2 }}>{item.meta}</Text>
                </View>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: tone === 'overdue' ? 'rgba(224,106,106,0.14)' : tone === 'soon' ? 'rgba(224,177,90,0.14)' : colors.lift,
                  }}
                >
                  <Text
                    style={{
                      color: tone === 'overdue' ? colors.danger : tone === 'soon' ? colors.warn : colors.mute,
                      fontSize: 11,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    {shortDate(item.date)}
                  </Text>
                </View>
              </Pressable>
            )
          })
        )}
      </GlowPanel>

      <TransactionSheet open={txOpen} initialType={txType} onClose={() => setTxOpen(false)} />

      <Sheet
        open={eventOpen}
        title="Nuevo aviso"
        subtitle="Un recordatorio de fecha: pago de luz, vacuna, visita. Si hay que hacerlo y tacharlo, crea una tarea."
        onClose={() => setEventOpen(false)}
      >
        <Field label="De qué quieres acordarte" placeholder="Pago de luz, supermercado..." value={eventTitle} onChangeText={setEventTitle} />
        <DatePickerField label="Cuándo" value={eventDate} onChange={setEventDate} presets={datePresets('event')} />
        <Button
          title="Guardar aviso"
          onPress={() => {
            if (eventTitle.trim().length < 2) {
              toast.push('Escribe un título')
              return
            }
            addEvent({ title: eventTitle, date: eventDate, kind: 'other' as EventKind, note: '' })
            setEventTitle('')
            setEventOpen(false)
            toast.push('Aviso creado')
          }}
        />
      </Sheet>
    </Screen>
  )
}
