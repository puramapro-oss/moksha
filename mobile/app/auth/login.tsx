import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Flame, Mail, Lock, Eye, EyeOff } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Remplis tous les champs')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Email ou mot de passe incorrect')
        } else {
          setError(authError.message)
        }
      }
    } catch {
      setError('Erreur de connexion. Vérifie ta connexion internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 20, backgroundColor: COLORS.primary + '20',
              justifyContent: 'center', alignItems: 'center', marginBottom: 16,
            }}>
              <Flame size={40} color={COLORS.primary} />
            </View>
            <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>MOKSHA</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}>
              Libère-toi. Crée ton empire.
            </Text>
          </View>

          {/* Form */}
          <Input
            testID="input-email"
            label="Email"
            placeholder="ton@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View>
            <Input
              testID="input-password"
              label="Mot de passe"
              placeholder="Ton mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 14, top: 38 }}
            >
              {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={{ color: COLORS.error, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
          ) : null}

          <Button
            testID="btn-login"
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={{ marginBottom: 16 }}
          />

          <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
            <Text style={{ color: COLORS.primary, fontSize: 14, textAlign: 'center' }}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 4 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Pas encore de compte ?</Text>
            <TouchableOpacity testID="link-signup" onPress={() => router.push('/auth/signup')}>
              <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
