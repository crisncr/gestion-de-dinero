import { useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from './theme'

export function Screen({
  children,
  scroll = true,
  onRefresh,
}: {
  children: ReactNode
  scroll?: boolean
  onRefresh?: () => Promise<void>
}) {
  const [refreshing, setRefreshing] = useState(false)
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      tintColor={colors.mint}
      colors={[colors.mint]}
      onRefresh={async () => {
        setRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
        }
      }}
    />
  ) : undefined

  if (!scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink }} edges={['top']}>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>{children}</View>
      </SafeAreaView>
    )
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          automaticallyAdjustKeyboardInsets
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
