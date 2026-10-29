import { Link, useRouter } from 'expo-router'
import { Copy, Home, Lock, Mail, User } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { AuthScreen } from '../../src/AuthScreen'
import { BirthDateFields } from '../../src/BirthDateFields'
import { CurrencyPicker } from '../../src/CurrencyPicker'
import { LegalConsent } from '../../src/LegalConsent'
import { LEGAL_VERSION } from '../../src/legal/documents'
import { birthDateIso, isAdultBirthDate, UNDERAGE_MESSAGE } from '../../src/lib/age'
import { useStore } from '../../src/store/StoreProvider'
import { colors, fonts } from '../../src/theme'
import { Button, Field, useToast } from '../../src/ui'

export default function RegisterScreen() {
  const { register } = useStore()
  const toast = useToast()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [currency, setCurrency] = useState('CLP')
  const [invite, setInvite] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  return (
    <AuthScreen
      title="Crear tu hogar"
      subtitle="Siempre creas tu hogar. Si te invitaron, pon el código y entras al de esa persona; el tuyo queda guardado."
    >
      <Text style={{ color: colors.cream, fontFamily: fonts.semibold, marginBottom: 12 }}>Tus datos</Text>
      <View style={{ gap: 14 }}>
        <Field
          label="Nombre"
          icon={User}
          placeholder="Tu nombre"
          value={name}
          error={errors.name}
          onChangeText={(value) => {
            setName(value)
            setErrors((e) => ({ ...e, name: undefined }))
          }}
        />
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
          placeholder="Mínimo 8 caracteres"
          value={password}
          error={errors.password}
          onChangeText={(value) => {
            setPassword(value)
            setErrors((e) => ({ ...e, password: undefined }))
          }}
        />
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
      </View>

      <Text style={{ color: colors.cream, fontFamily: fonts.semibold, marginTop: 26, marginBottom: 12 }}>
        Tu hogar
      </Text>
      <View style={{ gap: 14 }}>
        <Field
          label="Nombre del hogar"
          icon={Home}
          placeholder="Casa Norte"
          value={householdName}
          error={errors.householdName}
          onChangeText={(value) => {
            setHouseholdName(value)
            setErrors((e) => ({ ...e, householdName: undefined }))
          }}
        />
        <CurrencyPicker value={currency} onChange={setCurrency} />
        <Field
          label="Código de invitación"
          icon={Copy}
          value={invite}
          autoCapitalize="characters"
          placeholder="Opcional"
          maxLength={6}
          error={errors.invite}
          onChangeText={(value) => {
            setInvite(value.toUpperCase())
            setErrors((e) => ({ ...e, invite: undefined }))
          }}
        />
        <LegalConsent
          accepted={accepted}
          onChange={(value) => {
            setAccepted(value)
            setErrors((e) => ({ ...e, terms: undefined }))
          }}
          error={errors.terms}
        />
      </View>

      <View style={{ marginTop: 22 }}>
        <Button
          title={busy ? 'Creando...' : 'Crear cuenta'}
          disabled={busy}
          onPress={async () => {
            const birthDate = birthDateIso(day, month, year)
            const next = {
              name: name.trim().length >= 2 ? undefined : 'Escribe tu nombre',
              email: email.includes('@') ? undefined : 'Escribe un correo válido',
              password: password.length >= 8 ? undefined : 'Mínimo 8 caracteres',
              birthDate: !birthDate
                ? 'Escribe una fecha válida'
                : isAdultBirthDate(birthDate)
                  ? undefined
                  : UNDERAGE_MESSAGE,
              householdName: householdName.trim().length >= 2 ? undefined : 'Escribe el nombre del hogar',
              terms: accepted ? undefined : 'Debes aceptar los Términos y la Política de Privacidad',
            }
            setErrors(next)
            if (Object.values(next).some(Boolean) || !birthDate) return
            try {
              setBusy(true)
              const result = await register({
                name,
                email,
                password,
                birthDate,
                householdName,
                monthlyBudget: 0,
                currency,
                acceptedTerms: true,
                termsVersion: LEGAL_VERSION,
                inviteCode: invite.trim() || undefined,
              })
              if (result.needsVerification) {
                router.replace({ pathname: '/(auth)/verificar', params: { email: result.email || email } })
                return
              }
              router.replace('/(app)')
            } catch (error) {
              toast.push(error instanceof Error ? error.message : 'No se pudo crear')
            } finally {
              setBusy(false)
            }
          }}
        />
      </View>
      <View style={{ marginTop: 28, alignItems: 'center' }}>
        <Text style={{ color: colors.mute, fontFamily: fonts.regular }}>¿Ya tienes cuenta?</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable style={{ marginTop: 8 }}>
            <Text style={{ color: colors.mint, fontSize: 15, fontFamily: fonts.bold }}>Entrar</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  )
}
