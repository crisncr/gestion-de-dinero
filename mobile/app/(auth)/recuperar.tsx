import { Link, useRouter } from 'expo-router'
import { Lock, Mail } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { AuthScreen } from '../../src/AuthScreen'
import { maskEmail } from '../../src/lib/format'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import { Button, Field, useToast } from '../../src/ui'

export default function RecoverScreen() {
  const { requestPasswordReset, checkResetCode, finishPasswordReset } = useStore()
  const toast = useToast()
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  if (step === 'email') {
    return (
      <AuthScreen
        title="Recuperar acceso"
        subtitle="Te enviaremos un código al correo. Sin ese código no se puede cambiar la contraseña."
      >
        <View style={{ gap: 16 }}>
          <Field
            label="Correo"
            icon={Mail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@correo.com"
            value={email}
            error={errors.email}
            onChangeText={setEmail}
          />
          <Button
            title={busy ? 'Enviando...' : 'Enviar código'}
            disabled={busy}
            onPress={async () => {
              const next = { email: email.includes('@') ? undefined : 'Escribe un correo válido' }
              setErrors(next)
              if (next.email) return
              try {
                setBusy(true)
                await requestPasswordReset(email)
                setStep('code')
                toast.push(`Si el correo existe, enviamos un código a ${maskEmail(email)}`)
              } catch (error) {
                toast.push(error instanceof Error ? error.message : 'No se pudo enviar')
              } finally {
                setBusy(false)
              }
            }}
          />
        </View>
        <Link href="/(auth)/login" asChild>
          <Pressable style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.mint, fontFamily: fonts.bold }}>Volver a entrar</Text>
          </Pressable>
        </Link>
      </AuthScreen>
    )
  }

  if (step === 'code') {
    return (
      <AuthScreen
        title="Código del correo"
        subtitle={`Revisa ${maskEmail(email)}. Primero confirmamos el código; después podrás crear la clave nueva.`}
      >
        <View style={{ gap: 16 }}>
          <Field
            label="Código de 6 dígitos"
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            error={errors.code}
            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
          />
          <Button
            title={busy ? 'Comprobando...' : 'Confirmar código'}
            disabled={busy || code.length < 6}
            onPress={async () => {
              if (code.length < 6) return setErrors({ code: 'Escribe el código de 6 dígitos' })
              try {
                setBusy(true)
                await checkResetCode(email, code)
                setStep('password')
              } catch (error) {
                toast.push(error instanceof Error ? error.message : 'El código no es válido')
              } finally {
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
                await requestPasswordReset(email)
                toast.push('Enviamos un código nuevo')
              } catch (error) {
                toast.push(error instanceof Error ? error.message : 'No se pudo reenviar')
              }
            }}
          />
        </View>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title="Nueva contraseña" subtitle="El código ya fue validado. Elige una clave nueva de al menos 8 caracteres.">
      <View style={{ gap: 16 }}>
        <Field
          label="Nueva contraseña"
          icon={Lock}
          password
          placeholder="Mínimo 8 caracteres"
          value={password}
          error={errors.password}
          onChangeText={setPassword}
        />
        <Field
          label="Confirmar contraseña"
          icon={Lock}
          password
          placeholder="Repite la contraseña"
          value={confirm}
          error={errors.confirm}
          onChangeText={setConfirm}
        />
        <Button
          title={busy ? 'Guardando...' : 'Guardar contraseña'}
          disabled={busy}
          onPress={async () => {
            const next = {
              password: password.length >= 8 ? undefined : 'Mínimo 8 caracteres',
              confirm: password === confirm ? undefined : 'Las contraseñas no coinciden',
            }
            setErrors(next)
            if (Object.values(next).some(Boolean)) return
            try {
              setBusy(true)
              await finishPasswordReset(email, code, password)
              toast.push('Contraseña actualizada. Entra con la nueva clave.')
              router.replace('/(auth)/login')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo guardar')
            } finally {
              setBusy(false)
            }
          }}
        />
      </View>
    </AuthScreen>
  )
}
