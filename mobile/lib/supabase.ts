import 'react-native-url-polyfill/auto'
import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const adapter = {
  getItem: async (k: string) =>
    Platform.OS === 'web' ? localStorage.getItem(k) : await SecureStore.getItemAsync(k),
  setItem: async (k: string, v: string) => {
    Platform.OS === 'web' ? localStorage.setItem(k, v) : await SecureStore.setItemAsync(k, v)
  },
  removeItem: async (k: string) => {
    Platform.OS === 'web' ? localStorage.removeItem(k) : await SecureStore.deleteItemAsync(k)
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://auth.purama.dev'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: adapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  db: { schema: 'moksha' },
})
