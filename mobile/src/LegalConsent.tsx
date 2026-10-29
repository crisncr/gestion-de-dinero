import { Check } from 'lucide-react-native'
import { Linking, Pressable, Text, View } from 'react-native'
import { LEGAL_UPDATED, LEGAL_VERSION, legalUrl } from './legal/documents'
import { colors, fonts } from './theme'

async function openLegal(kind: 'terms' | 'privacy') {
  const url = legalUrl(kind)
  const allowed = await Linking.canOpenURL(url)
  if (!allowed) return
  await Linking.openURL(url)
}

export function LegalConsent({
  accepted,
  onChange,
  error,
}: {
  accepted: boolean
  onChange: (value: boolean) => void
  error?: string
}) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={() => onChange(!accepted)}
        style={{
          borderRadius: 18,
          backgroundColor: accepted ? 'rgba(85,214,160,0.08)' : colors.lift,
          borderWidth: 1,
          borderColor: error ? colors.danger : accepted ? 'rgba(85,214,160,0.4)' : colors.line,
          padding: 14,
          flexDirection: 'row',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            marginTop: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accepted ? colors.mint : 'transparent',
            borderWidth: accepted ? 0 : 1.5,
            borderColor: error ? colors.danger : colors.mute,
          }}
        >
          {accepted ? <Check size={14} color={colors.ink} strokeWidth={3} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.cream, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 }}>
            He leído y acepto los{' '}
            <Text onPress={() => openLegal('terms')} style={{ color: colors.mint, fontFamily: fonts.bold }}>
              Términos y Condiciones
            </Text>
            {' '}y la{' '}
            <Text onPress={() => openLegal('privacy')} style={{ color: colors.mint, fontFamily: fonts.bold }}>
              Política de Privacidad
            </Text>
            .
          </Text>
          <Text style={{ color: colors.mute, fontFamily: fonts.regular, fontSize: 11, marginTop: 8, lineHeight: 16 }}>
            Consentimiento para el tratamiento de datos personales según la Ley N° 21.719. Versión {LEGAL_VERSION} · {LEGAL_UPDATED}.
          </Text>
        </View>
      </Pressable>
      {error ? <Text style={{ color: colors.danger, fontFamily: fonts.semibold, fontSize: 12 }}>{error}</Text> : null}
    </View>
  )
}

export function LegalLinks() {
  return (
    <View>
      <Pressable onPress={() => openLegal('terms')} style={{ paddingVertical: 6 }}>
        <Text style={{ color: colors.mint, fontFamily: fonts.semibold }}>Términos y Condiciones</Text>
      </Pressable>
      <Pressable onPress={() => openLegal('privacy')} style={{ paddingVertical: 6 }}>
        <Text style={{ color: colors.mint, fontFamily: fonts.semibold }}>Política de Privacidad</Text>
      </Pressable>
    </View>
  )
}
