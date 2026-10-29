import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BrandLogo } from './BrandLogo'
import { colors, fonts } from './theme'

export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink }} edges={['top', 'bottom']}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          left: 40,
          right: 40,
          height: 220,
          borderRadius: 220,
          backgroundColor: 'rgba(85,214,160,0.10)',
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 22,
            paddingTop: 28,
            paddingBottom: 32,
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <BrandLogo size={96} />
          </View>

          <Text style={{ color: colors.cream, fontSize: 28, lineHeight: 34, fontFamily: fonts.extra }}>
            {title}
          </Text>
          <Text
            style={{
              color: colors.mute,
              fontSize: 15,
              lineHeight: 22,
              marginTop: 8,
              marginBottom: 28,
              fontFamily: fonts.regular,
            }}
          >
            {subtitle}
          </Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
