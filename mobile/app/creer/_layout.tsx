import { Stack } from 'expo-router'

export default function CreerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#070B18' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="entreprise" />
      <Stack.Screen name="association" />
    </Stack>
  )
}
