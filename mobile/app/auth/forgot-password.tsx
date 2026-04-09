import { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Mail } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async () => {
    if (!email.trim()) return
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://moksha.purama.dev/auth/callback?type=recovery',
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>

          {sent ? (
            <View style={{ alignItems: 'center' }}>
              <Mail size={48} color={COLORS.accent} />
              <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 8 }}>
                Email envoyé !
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' }}>
                Vérifie ta boîte mail pour réinitialiser ton mot de passe.
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 8 }}>
                Mot de passe oublié
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 32 }}>
                Entre ton email pour recevoir un lien de réinitialisation.
              </Text>
              <Input label="Email" placeholder="ton@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Button title="Envoyer le lien" onPress={handleReset} loading={loading} size="lg" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
