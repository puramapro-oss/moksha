import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Flame, ArrowLeft } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function SignUpScreen() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Remplis tous les champs')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (authError) {
        setError(authError.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Erreur de connexion. Vérifie ta connexion internet.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Bienvenue !</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
            Ton compte MOKSHA est créé. Tu peux maintenant te connecter.
          </Text>
          <Button title="Se connecter" onPress={() => router.replace('/auth/login')} size="lg" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <TouchableOpacity testID="btn-back" onPress={() => router.back()} style={{ marginBottom: 24 }}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: 4 }}>Créer un compte</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 32 }}>
            Rejoins MOKSHA et libère ton potentiel entrepreneurial
          </Text>

          <Input testID="input-name" label="Nom complet" placeholder="Prénom Nom" value={fullName} onChangeText={setFullName} />
          <Input testID="input-email" label="Email" placeholder="ton@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input testID="input-password" label="Mot de passe" placeholder="8 caractères minimum" value={password} onChangeText={setPassword} secureTextEntry />

          {error ? (
            <Text style={{ color: COLORS.error, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
          ) : null}

          <Button testID="btn-signup" title="Créer mon compte" onPress={handleSignUp} loading={loading} size="lg" style={{ marginBottom: 16 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
