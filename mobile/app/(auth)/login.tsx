import { Link, useRouter } from 'expo-router'
import { Lock, Mail } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { AuthScreen } from '../../src/AuthScreen'
import { BirthDateFields } from '../../src/BirthDateFields'
import { LegalConsent } from '../../src/LegalConsent'
import { LEGAL_VERSION } from '../../src/legal/documents'
import { birthDateIso } from '../../src/lib/age'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import { Button, Field, useToast } from '../../src/ui'

export default function LoginScreen() {
  const { login, confirmBirthDate } = useStore()
  const toast = useToast()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [askConsent, setAskConsent] = useState(false)
  const [askBirthDate, setAskBirthDate] = useState(false)
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; terms?: string; birthDate?: string }>({})

  return (
    <AuthScreen title="Bienvenido de nuevo" subtitle="Entra a tu hogar para ver finanzas, compras y familia.">
      <View style={{ gap: 16 }}>
        <Field
          label="Correo"
          icon={Mail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="tu@correo.com"
          value={email}
          error={errors.email}
          onChangeText={(value) => {
            setEmail(value)
            setErrors((e) => ({ ...e, email: undefined }))
          }}
        />
        <Field
          label="Contraseña"
          icon={Lock}
          password
          placeholder="Ingresa tu contraseña"
          value={password}
          error={errors.password}
          onChangeText={(value) => {
            setPassword(value)
            setErrors((e) => ({ ...e, password: undefined }))
          }}
        />
        {askBirthDate ? (
          <BirthDateFields
            day={day}
            month={month}
            year={year}
            error={errors.birthDate}
            onChange={(next) => {
              setDay(next.day)
              setMonth(next.month)
              setYear(next.year)
              setErrors((e) => ({ ...e, birthDate: undefined }))
            }}
          />
        ) : null}
        {askConsent ? (
          <LegalConsent
            accepted={accepted}
            onChange={(value) => {
              setAccepted(value)
              setErrors((e) => ({ ...e, terms: undefined }))
            }}
            error={errors.terms}
          />
        ) : null}
        <Link href="/(auth)/recuperar" asChild>
          <Pressable style={{ alignSelf: 'flex-end' }}>
            <Text style={{ color: colors.mute, fontSize: 13, fontFamily: fonts.semibold }}>
              Recuperar contraseña
            </Text>
          </Pressable>
        </Link>
        <Button
          title={busy ? 'Entrando...' : 'Entrar'}
          disabled={busy}
          onPress={async () => {
            const birthDate = birthDateIso(day, month, year)
            const next = {
              email: email.includes('@') ? undefined : 'Escribe un correo válido',
              password: password.length > 0 ? undefined : 'Ingresa tu contraseña',
              birthDate: askBirthDate && !birthDate ? 'Escribe una fecha válida' : undefined,
              terms: askConsent && !accepted ? 'Debes aceptar los Términos para continuar' : undefined,
            }
            setErrors(next)
            if (next.email || next.password || next.terms || next.birthDate) return
            const consent = askConsent && accepted ? { acceptedTerms: true, termsVersion: LEGAL_VERSION } : undefined
            try {
              setBusy(true)
              const result = askBirthDate
                ? await confirmBirthDate(email, password, birthDate as string, consent)
                : await login(email, password, consent)
              if (result.needsBirthDate) {
                setAskBirthDate(true)
                toast.push('Indica tu fecha de nacimiento para continuar')
                return
              }
              if (result.needsConsent) {
                setAskConsent(true)
                toast.push('Acepta los Términos para entrar')
                return
              }
              if (result.needsVerification) {
                router.replace({ pathname: '/(auth)/verificar', params: { email: result.email || email } })
                return
              }
              router.replace('/(app)')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo entrar')
            } finally {
              setBusy(false)
            }
          }}
        />
      </View>
      <View style={{ marginTop: 28, alignItems: 'center' }}>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>
          ¿Aún no tienes cuenta?
        </Text>
        <Link href="/(auth)/registro" asChild>
          <Pressable style={{ marginTop: 8 }}>
            <Text style={{ color: colors.mint, fontSize: 15, fontFamily: fonts.bold }}>Crear hogar</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  )
}
