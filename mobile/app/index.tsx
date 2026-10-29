import { Redirect } from 'expo-router'
import { View } from 'react-native'
import { BrandLogo } from '../src/BrandLogo'
import { useStore } from '../src/store/StoreProvider'
import { colors } from '../src/theme'

export default function Index() {
  const { ready, currentUser } = useStore()
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <BrandLogo size={128} />
      </View>
    )
  }
  return <Redirect href={currentUser ? '/(app)' : '/(auth)/login'} />
}
