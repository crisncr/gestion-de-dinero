import { Redirect, Tabs } from 'expo-router'
import { Ellipsis, Home, ShoppingBasket, Users, Wallet } from 'lucide-react-native'
import { View } from 'react-native'
import { BrandLogo } from '../../src/BrandLogo'
import { useStore } from '../../src/store/StoreProvider'
import { colors } from '../../src/theme'

export default function AppLayout() {
  const { ready, currentUser } = useStore()
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <BrandLogo size={112} />
      </View>
    )
  }
  if (!currentUser) return <Redirect href="/(auth)/login" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.ink,
          borderTopWidth: 0,
          height: 68,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.mute,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Home color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="finanzas"
        options={{ title: 'Finanzas', tabBarIcon: ({ color }) => <Wallet color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="compras"
        options={{ title: 'Compras', tabBarIcon: ({ color }) => <ShoppingBasket color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="familia"
        options={{ title: 'Familia', tabBarIcon: ({ color }) => <Users color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="mas"
        options={{ title: 'Más', tabBarIcon: ({ color }) => <Ellipsis color={color} size={20} /> }}
      />
    </Tabs>
  )
}
