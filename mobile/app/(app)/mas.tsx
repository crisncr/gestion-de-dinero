import { useRouter } from 'expo-router'
import { Bell, ChevronRight, ListTodo, PawPrint, Settings } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { GlowPanel } from '../../src/GlowPanel'
import { Screen } from '../../src/Screen'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'

export default function MoreScreen() {
  const router = useRouter()
  const { household, members, state, stats, refresh } = useStore()
  const pets = state.pets.filter((pet) => pet.householdId === household?.id).length
  const tasks = state.tasks.filter((task) => task.householdId === household?.id && !task.done).length
  const avisos = stats.upcoming.length

  const house = [
    {
      href: '/mascotas',
      label: 'Mascotas',
      text: pets ? `${pets} en el hogar` : 'Vacunas, comida y arena',
      icon: PawPrint,
      color: '#A78BFA',
    },
    {
      href: '/tareas',
      label: 'Tareas',
      text: tasks ? `${tasks} pendiente${tasks === 1 ? '' : 's'}` : 'Nada pendiente',
      icon: ListTodo,
      color: '#5B8CFF',
    },
    {
      href: '/notificaciones',
      label: 'Avisos',
      text: avisos ? `${avisos} con fecha` : 'Todo al día',
      icon: Bell,
      color: '#38BDF8',
    },
  ] as const

  return (
    <Screen onRefresh={refresh}>
      <View>
        <Text style={{ color: colors.mint, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.6 }}>CENTRO</Text>
        <Text style={{ color: colors.cream, fontSize: 30, fontFamily: fonts.extra, marginTop: 4 }}>Más</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, marginTop: 4 }}>
          {household?.name ?? 'Tu hogar'} · {members.length} integrante{members.length === 1 ? '' : 's'}
        </Text>
      </View>

      <GlowPanel>
        <Text style={{ color: 'rgba(85,214,160,0.8)', fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.4 }}>
          ESTADO DEL HOGAR
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Mascotas', value: String(pets), href: '/mascotas', color: '#A78BFA' },
            { label: 'Tareas', value: String(tasks), href: '/tareas', color: '#5B8CFF' },
            { label: 'Avisos', value: String(avisos), href: '/notificaciones', color: colors.mint },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 18,
                paddingVertical: 14,
                paddingHorizontal: 8,
                borderWidth: 1,
                borderColor: `${item.color}33`,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: item.color, fontSize: 22, fontFamily: fonts.extra }}>{item.value}</Text>
              <Text style={{ color: colors.mute, fontSize: 11, fontFamily: fonts.semibold, marginTop: 4 }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </GlowPanel>

      <Text style={{ color: colors.mute, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.4, marginTop: 4 }}>
        MÓDULOS
      </Text>
      <View
        style={{
          backgroundColor: '#101210',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: 'hidden',
        }}
      >
        {house.map((item, index) => {
          const Icon = item.icon
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.line,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: `${item.color}18`,
                  borderWidth: 1,
                  borderColor: `${item.color}33`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 16 }}>{item.label}</Text>
                <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 3 }}>{item.text}</Text>
              </View>
              <ChevronRight size={18} color={colors.mute} />
            </Pressable>
          )
        })}
      </View>

      <Pressable onPress={() => router.push('/ajustes')}>
        <View
          style={{
            backgroundColor: '#101210',
            borderRadius: 26,
            borderWidth: 1,
            borderColor: 'rgba(85,214,160,0.22)',
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: 'rgba(85,214,160,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(85,214,160,0.28)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={18} color={colors.mint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 16 }}>Ajustes</Text>
            <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 3 }}>
              Perfil, hogares y sesión
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mint} />
        </View>
      </Pressable>
    </Screen>
  )
}
