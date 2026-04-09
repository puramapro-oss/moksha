import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'
import { useRouter, useSegments } from 'expo-router'
import type { Session } from '@supabase/supabase-js'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return

    const inAuthGroup = segments[0] === 'auth'

    if (!session && !inAuthGroup) {
      router.replace('/auth/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, segments, router])

  if (session === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070B18' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    )
  }

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <AuthGuard>
      <StatusBar style="light" backgroundColor="#070B18" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#070B18' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="creer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="jurisia" />
        <Stack.Screen name="proofvault" />
        <Stack.Screen name="simulateur" />
        <Stack.Screen name="parrainage" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="points" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="aide" />
        <Stack.Screen name="rappels" />
        <Stack.Screen name="partage" />
      </Stack>
    </AuthGuard>
  )
}
