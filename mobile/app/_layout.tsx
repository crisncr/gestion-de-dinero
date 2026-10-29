import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { type ReactNode, useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StoreProvider, useStore } from '../src/store/StoreProvider'
import { colors } from '../src/theme'
import { ToastProvider } from '../src/ui'

SplashScreen.preventAutoHideAsync()

function ReadyGate({ children }: { children: ReactNode }) {
  const { ready } = useStore()

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null
  return children
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  })

  if (!loaded) return null

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ReadyGate>
          <ToastProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.ink },
                animation: 'fade',
              }}
            />
          </ToastProvider>
        </ReadyGate>
      </StoreProvider>
    </SafeAreaProvider>
  )
}
