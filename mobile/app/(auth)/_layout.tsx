import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useStore } from '../../src/store/StoreProvider'
import { colors } from '../../src/theme'

export default function AuthLayout() {
  const { ready, currentUser } = useStore()
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.mint} />
      </View>
    )
  }
  if (currentUser) return <Redirect href="/(app)" />
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }} />
}
