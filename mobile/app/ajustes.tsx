import { Redirect, useRouter } from 'expo-router'
import { Home, Lock, Mail, User } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { BrandLogo } from '../src/BrandLogo'
import { LegalLinks } from '../src/LegalConsent'
import { BackHeader } from '../src/BackHeader'
import { BudgetSheet } from '../src/BudgetSheet'
import { Screen } from '../src/Screen'
import { currencyCaption } from '../src/data/currencies'
import { useStore } from '../src/store/StoreProvider'
import { colors, fonts } from '../src/theme'
import { Avatar, Button, Card, Field, SettingRow, Sheet, useToast } from '../src/ui'

const roleLabel = { owner: 'Titular', admin: 'Administrador', member: 'Integrante' } as const

export default function SettingsScreen() {
  const {
    currentUser,
    household,
    households,
    membership,
    canManage,
    cloud,
    state,
    updateProfile,
    updateHousehold,
    setActiveHousehold,
    changePassword,
    logout,
    deleteAccount,
    refresh,
  } = useStore()
  const toast = useToast()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [homeOpen, setHomeOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [passOpen, setPassOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(currentUser?.name ?? '')
  const [homeName, setHomeName] = useState(household?.name ?? '')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [deleteWord, setDeleteWord] = useState('')
  const [busy, setBusy] = useState(false)
  const currency = household?.currency ?? 'CLP'
  const canDelete = deleteWord.trim().toLowerCase() === 'eliminar'

  useEffect(() => {
    setHomeName(household?.name ?? '')
  }, [household?.id, household?.name])

  if (!currentUser) return <Redirect href="/(auth)/login" />

  return (
    <Screen onRefresh={refresh}>
      <BackHeader title="Ajustes" />

      <Card style={{ backgroundColor: colors.wallet, alignItems: 'center', paddingVertical: 26 }}>
        <Avatar name={currentUser?.name ?? 'H'} size={76} />
        <Text style={{ color: colors.cream, fontSize: 22, fontFamily: fonts.extra, marginTop: 14 }}>
          {currentUser?.name}
        </Text>
        <Text style={{ color: colors.mute, marginTop: 4, fontFamily: fonts.regular }}>{currentUser?.email}</Text>
        <View
          style={{
            marginTop: 12,
            backgroundColor: 'rgba(85,214,160,0.12)',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: colors.mint, fontFamily: fonts.semibold, fontSize: 12 }}>
            {household?.name} · {membership ? roleLabel[membership.role] : 'Hogar'}
          </Text>
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Perfil</Text>
          <Button title="Editar" size="sm" variant="secondary" onPress={() => { setName(currentUser?.name ?? ''); setProfileOpen(true) }} />
        </View>
        <SettingRow label="Nombre" value={currentUser?.name} />
        <SettingRow label="Correo" value={currentUser?.email} last />
      </Card>

      <Card>
        <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Tus hogares</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
          Si te unes a otro, el tuyo queda guardado. Toca para cambiar cuál estás viendo.
        </Text>
        {households.map((home) => {
          const role = state.members.find((row) => row.householdId === home.id && row.userId === currentUser.id)?.role
          const active = home.id === household?.id
          return (
            <Pressable
              key={home.id}
              onPress={async () => {
                if (active) return
                try {
                  await setActiveHousehold(home.id)
                  toast.push(`Ahora estás en ${home.name}`)
                } catch (error) {
                  toast.push(error instanceof Error ? error.message : 'No se pudo cambiar de hogar')
                }
              }}
              style={{
                marginTop: 12,
                borderRadius: 16,
                padding: 14,
                backgroundColor: active ? 'rgba(85,214,160,0.08)' : colors.lift,
                borderWidth: 1,
                borderColor: active ? 'rgba(85,214,160,0.4)' : colors.line,
              }}
            >
              <Text style={{ color: colors.cream, fontFamily: fonts.bold, fontSize: 16 }}>{home.name}</Text>
              <Text style={{ color: active ? colors.mint : colors.mute, fontFamily: fonts.semibold, fontSize: 12, marginTop: 4 }}>
                {role ? roleLabel[role] : 'Integrante'}
                {active ? ' · Hogar activo' : ' · Guardado'}
              </Text>
            </Pressable>
          )
        })}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Hogar activo</Text>
          {canManage ? (
            <Button title="Editar" size="sm" variant="secondary" onPress={() => { setHomeName(household?.name ?? ''); setHomeOpen(true) }} />
          ) : null}
        </View>
        <SettingRow label="Nombre" value={household?.name} />
        <SettingRow label="Moneda" value={currencyCaption(currency)} onPress={() => setBudgetOpen(true)} />
        <SettingRow
          label="Datos"
          value={cloud ? 'Nube · Aiven' : 'Solo en este teléfono'}
          last
        />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.bold }}>Seguridad</Text>
          <Button title="Cambiar" size="sm" variant="secondary" onPress={() => setPassOpen(true)} />
        </View>
        <SettingRow label="Contraseña" value="••••••••" last />
      </Card>

      <Card>
        <Text style={{ color: colors.cream, fontFamily: fonts.bold, marginBottom: 8 }}>Legal</Text>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginBottom: 8 }}>
          Tratamiento de datos según la Ley N° 21.719. Puedes leer y conservar estos documentos.
        </Text>
        <LegalLinks />
      </Card>

      <Button
        title="Cerrar sesión"
        variant="secondary"
        onPress={async () => {
          await logout()
          router.replace('/(auth)/login')
        }}
      />
      <Button title="Eliminar cuenta" variant="danger" onPress={() => { setDeleteWord(''); setDeleteOpen(true) }} />

      <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 8 }}>
        <BrandLogo size={56} />
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 12, marginTop: 6 }}>
          El hogar, en un solo lugar
        </Text>
      </View>

      <Sheet open={profileOpen} title="Editar perfil" onClose={() => setProfileOpen(false)}>
        <Field label="Nombre" icon={User} placeholder="Tu nombre" value={name} onChangeText={setName} />
        <Field label="Correo" icon={Mail} value={currentUser?.email ?? ''} editable={false} />
        <Button
          title="Guardar cambios"
          onPress={() => {
            if (name.trim().length < 2) return toast.push('Escribe tu nombre')
            updateProfile(name)
            setProfileOpen(false)
            toast.push('Perfil actualizado')
          }}
        />
      </Sheet>

      <Sheet open={homeOpen} title="Editar hogar" onClose={() => setHomeOpen(false)}>
        <Field label="Nombre del hogar" icon={Home} value={homeName} onChangeText={setHomeName} editable={canManage} />
        <Button
          title="Guardar hogar"
          onPress={() => {
            try {
              updateHousehold({ name: homeName })
              setHomeOpen(false)
              toast.push('Hogar actualizado')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'Sin permiso')
            }
          }}
        />
      </Sheet>

      <Sheet open={passOpen} title="Cambiar contraseña" onClose={() => setPassOpen(false)}>
        <Field label="Actual" icon={Lock} password value={current} onChangeText={setCurrent} />
        <Field label="Nueva" icon={Lock} password placeholder="Mínimo 8 caracteres" value={next} onChangeText={setNext} />
        <Field label="Confirmar" icon={Lock} password value={confirm} onChangeText={setConfirm} />
        <Button
          title="Actualizar contraseña"
          onPress={async () => {
            if (next.length < 8) return toast.push('Mínimo 8 caracteres')
            if (next !== confirm) return toast.push('La nueva contraseña no coincide')
            try {
              await changePassword(current, next)
              setCurrent('')
              setNext('')
              setConfirm('')
              setPassOpen(false)
              toast.push('Contraseña actualizada')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo cambiar')
            }
          }}
        />
      </Sheet>

      <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} />

      <Sheet open={deleteOpen} title="Eliminar cuenta" onClose={() => setDeleteOpen(false)}>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 }}>
          Se borra tu registro y tus gastos. Si eres el único titular, también se elimina el hogar. Esto no se puede deshacer.
        </Text>
        <Field
          label='Escribe "eliminar" para confirmar'
          placeholder="eliminar"
          autoCapitalize="none"
          autoCorrect={false}
          value={deleteWord}
          onChangeText={setDeleteWord}
        />
        <Button
          title={busy ? 'Eliminando...' : 'Borrar mi cuenta'}
          variant="danger"
          disabled={!canDelete || busy}
          onPress={async () => {
            if (!canDelete) return
            try {
              setBusy(true)
              await deleteAccount()
              setDeleteOpen(false)
              router.replace('/(auth)/login')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo eliminar')
            } finally {
              setBusy(false)
            }
          }}
        />
      </Sheet>
    </Screen>
  )
}
