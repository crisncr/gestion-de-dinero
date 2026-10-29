import { Link, Stack } from 'expo-router'
import { Text, View } from 'react-native'
import { colors, fonts } from '../src/theme'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrada' }} />
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: colors.cream, fontSize: 20, fontFamily: fonts.bold }}>Esta pantalla no existe</Text>
        <Link href="/" style={{ marginTop: 16 }}>
          <Text style={{ color: colors.mint, fontFamily: fonts.semibold }}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  )
}
