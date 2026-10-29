import * as Clipboard from 'expo-clipboard'
import { Copy, Mail, UserPlus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Share, Text, View } from 'react-native'
import { FamilyTree } from '../../src/FamilyTree'
import { GlowPanel } from '../../src/GlowPanel'
import { Screen } from '../../src/Screen'
import { categoryLabel, expenseCategories, incomeCategories } from '../../src/data/catalog'
import { money, monthKey, shortDate } from '../../src/lib/format'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import type { Role } from '../../src/types'
import { Avatar, Button, Empty, Field, Sheet, useToast } from '../../src/ui'

const roleLabel = { owner: 'Titular', admin: 'Administrador', member: 'Integrante' } as const

export default function FamilyScreen() {
  const { household, members, canManage, state, addLocalMember, joinHousehold, removeMember, refresh } = useStore()
  const toast = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [localOpen, setLocalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const owner = members.find((member) => member.role === 'owner')
  const rest = members.filter((member) => member.role !== 'owner')
  const activity = state.transactions.filter((t) => t.householdId === household?.id).slice(0, 6)
  const currency = household?.currency ?? 'CLP'

  const inviteMessage = household
    ? `Hola, te invito a ${household.name} en Casa360, la app de la casa.\n\nCrea tu cuenta y usa este código para unirte: ${household.inviteCode}\n\nAsí vemos gastos, compras, tareas y la familia en un solo lugar.`
    : ''

  const shareInvite = async () => {
    if (!household) return
    try {
      await Share.share({
        title: `Únete a ${household.name}`,
        message: inviteMessage,
      })
    } catch {
      toast.push('No se pudo abrir compartir')
    }
  }

  return (
    <Screen onRefresh={refresh}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.mint, fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.6 }}>RED</Text>
          <Text style={{ color: colors.cream, fontSize: 30, fontFamily: fonts.extra, marginTop: 4 }}>Familia</Text>
          <Text style={{ color: colors.mute, marginTop: 4, fontFamily: fonts.regular }}>
            {household?.name} · {members.length} integrante{members.length === 1 ? '' : 's'}
          </Text>
        </View>
        {canManage ? <Button title="Invitar" size="sm" onPress={() => setInviteOpen(true)} /> : null}
      </View>

      <GlowPanel style={{ paddingVertical: 18, paddingHorizontal: 12 }}>
        <FamilyTree
          owner={owner ?? null}
          members={rest}
          canManage={canManage}
          onRemove={(id) => {
            removeMember(id)
            toast.push('Integrante quitado')
          }}
        />
      </GlowPanel>

      <View
        style={{
          backgroundColor: '#101210',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: 'hidden',
        }}
      >
        {members.map((member, index) => {
          const assigned = state.tasks.filter((t) => t.assignedMemberId === member.id && !t.done).length
          const contributed = state.transactions
            .filter((t) => t.memberId === member.id && t.type === 'income' && t.date.startsWith(monthKey()))
            .reduce((sum, t) => sum + t.amount, 0)
          return (
            <View
              key={member.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.line,
              }}
            >
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: member.role === 'owner' ? 'rgba(85,214,160,0.4)' : colors.line,
                  padding: 2,
                }}
              >
                <Avatar name={member.name} size={44} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 16 }}>{member.name}</Text>
                <Text
                  style={{
                    color: member.role === 'owner' ? colors.mint : colors.mute,
                    fontSize: 12,
                    fontFamily: fonts.semibold,
                    marginTop: 3,
                  }}
                >
                  {roleLabel[member.role]}
                </Text>
                <Text style={{ color: colors.mute, fontSize: 12, marginTop: 6, fontFamily: fonts.regular }}>
                  Este mes aportó {money(contributed, currency)}
                  {assigned ? ` · ${assigned} tarea${assigned === 1 ? '' : 's'}` : ''}
                </Text>
              </View>
            </View>
          )
        })}
      </View>

      <GlowPanel accent="#5B8CFF">
        <Text style={{ color: 'rgba(91,140,255,0.85)', fontSize: 11, fontFamily: fonts.semibold, letterSpacing: 1.4 }}>
          ENLACE
        </Text>
        <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 16, marginTop: 6 }}>Unirse a otro hogar</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 12, marginTop: 6, marginBottom: 14, lineHeight: 18 }}>
          El tuyo queda guardado. Luego lo cambias en Ajustes.
        </Text>
        <Field
          label="Código"
          icon={Copy}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          placeholder="ABC123"
          maxLength={6}
        />
        <View style={{ height: 12 }} />
        <Button
          title="Unirme"
          variant="secondary"
          onPress={async () => {
            try {
              await joinHousehold(code)
              setCode('')
              toast.push('Entraste a ese hogar. El tuyo sigue en Ajustes')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo unir')
            }
          }}
        />
      </GlowPanel>

      <View
        style={{
          backgroundColor: '#101210',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 18,
        }}
      >
        <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Actividad reciente</Text>
        {activity.length === 0 ? (
          <Empty title="Sin actividad" text="Los movimientos del hogar aparecerán aquí." />
        ) : (
          activity.map((row) => {
            const cats = row.type === 'income' ? incomeCategories : expenseCategories
            return (
              <View
                key={row.id}
                style={{
                  paddingVertical: 13,
                  borderTopWidth: 1,
                  borderTopColor: colors.line,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: colors.cream, fontFamily: fonts.semibold }}>
                    {row.description || categoryLabel(row.category, cats)}
                  </Text>
                  <Text style={{ color: colors.mute, fontSize: 12, fontFamily: fonts.regular, marginTop: 3 }}>
                    {categoryLabel(row.category, cats)} · {shortDate(row.date)}
                  </Text>
                </View>
                <Text style={{ color: row.type === 'income' ? colors.mint : colors.cream, fontFamily: fonts.bold }}>
                  {row.type === 'income' ? '+' : '−'}
                  {money(row.amount, currency)}
                </Text>
              </View>
            )
          })
        )}
      </View>

      <Sheet
        open={inviteOpen}
        title="Compartir invitación"
        subtitle="Elige por dónde enviarlo: WhatsApp, mensajes u otra app. El código queda en el texto."
        onClose={() => setInviteOpen(false)}
      >
        <View
          style={{
            borderRadius: 22,
            backgroundColor: '#0A0C0B',
            padding: 18,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(85,214,160,0.28)',
          }}
        >
          <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 12 }}>Código de {household?.name}</Text>
          <Text style={{ color: colors.cream, fontSize: 32, letterSpacing: 8, fontFamily: fonts.extra, marginTop: 8 }}>
            {household?.inviteCode}
          </Text>
        </View>
        <Button
          title="Elegir cómo enviarlo"
          onPress={async () => {
            await shareInvite()
            setInviteOpen(false)
          }}
        />
        <Button
          title="Copiar código"
          variant="secondary"
          onPress={async () => {
            if (!household) return
            await Clipboard.setStringAsync(household.inviteCode)
            toast.push('Código copiado')
          }}
        />
        <Button
          title="Agregar a alguien sin cuenta"
          variant="secondary"
          onPress={() => {
            setInviteOpen(false)
            setLocalOpen(true)
          }}
        />
      </Sheet>

      <Sheet
        open={localOpen}
        title="Persona del hogar"
        subtitle="Queda en el árbol aunque todavía no tenga cuenta."
        onClose={() => setLocalOpen(false)}
      >
        <Field label="Nombre" icon={UserPlus} placeholder="Nombre de la persona" value={name} onChangeText={setName} />
        <Field label="Correo" icon={Mail} placeholder="Opcional" value={email} onChangeText={setEmail} />
        <Button
          title="Guardar"
          onPress={() => {
            if (name.trim().length < 2) return toast.push('Escribe el nombre')
            addLocalMember(name, email, 'member' as Exclude<Role, 'owner'>)
            setName('')
            setEmail('')
            setLocalOpen(false)
            toast.push('Integrante agregado al árbol')
          }}
        />
      </Sheet>
    </Screen>
  )
}

