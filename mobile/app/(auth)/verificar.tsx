import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { AuthScreen } from '../../src/AuthScreen'
import { maskEmail } from '../../src/lib/format'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import { Button, Field, useToast } from '../../src/ui'

export default function VerifyScreen() {
  const { confirmCode, enterSession, resendCode } = useStore()
  const toast = useToast()
  const router = useRouter()
  const params = useLocalSearchParams<{ email?: string }>()
  const email = String(params.email || '')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <AuthScreen title="Cuenta creada con éxito" subtitle="Tu correo ya está confirmado. Entrando a tu hogar...">
        <View
          style={{
            height: 72,
            borderRadius: 20,
            backgroundColor: 'rgba(85,214,160,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.mint, fontFamily: fonts.bold, fontSize: 16 }}>Listo</Text>
        </View>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title="Activa tu cuenta"
      subtitle={`Enviamos un código a ${maskEmail(email)}. Escríbelo para entrar.`}
    >
      <View style={{ gap: 16 }}>
        <Field
          label="Código de confirmación"
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
          value={code}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
        />
        <Button
          title={busy ? 'Activando...' : 'Activar cuenta'}
          disabled={busy || code.length < 6}
          onPress={async () => {
            if (code.length < 6) return toast.push('Escribe el código de 6 dígitos')
            try {
              setBusy(true)
              const snap = await confirmCode(email, code)
              setDone(true)
              setTimeout(async () => {
                await enterSession(snap)
                router.replace('/(app)')
              }, 1400)
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'El código no es válido')
              setBusy(false)
            }
          }}
        />
        <Button
          title="Enviar otro código"
          variant="secondary"
          disabled={busy}
          onPress={async () => {
            try {
              await resendCode(email)
              toast.push(`Nuevo código enviado a ${maskEmail(email)}`)
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo reenviar')
            }
          }}
        />
      </View>
    </AuthScreen>
  )
}
