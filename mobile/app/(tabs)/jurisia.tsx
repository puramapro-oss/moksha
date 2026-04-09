import { useState, useRef, useCallback } from 'react'
import { View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Send, Scale, Sparkles } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'

type Message = { id: string; role: 'user' | 'assistant'; content: string; sources?: string[] }

const SUGGESTIONS = [
  'Quelle structure pour un freelance dev ?',
  'Comment rédiger mes statuts SASU ?',
  'Quelles sont les obligations URSSAF ?',
  'Différence micro-entreprise vs SASU ?',
]

export default function JurisIAScreen() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text ?? input.trim()
    if (!msg || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://moksha.purama.dev/api/jurisia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, userId: user?.id }),
      })
      const data = await res.json()
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response ?? 'Désolé, une erreur est survenue. Réessaie.',
        sources: data.sources,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erreur de connexion. Vérifie ta connexion internet et réessaie.',
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, user])

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={{
      alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      marginBottom: 12,
    }}>
      <View style={{
        backgroundColor: item.role === 'user' ? COLORS.primary : COLORS.card,
        borderRadius: 16,
        borderTopRightRadius: item.role === 'user' ? 4 : 16,
        borderTopLeftRadius: item.role === 'user' ? 16 : 4,
        padding: 14,
        borderWidth: item.role === 'assistant' ? 1 : 0,
        borderColor: COLORS.border,
      }}>
        <Text style={{ color: '#FFF', fontSize: 15, lineHeight: 22 }}>{item.content}</Text>
      </View>
      {item.sources && item.sources.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {item.sources.map((s, i) => (
            <View key={i} style={{ backgroundColor: COLORS.accent + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: COLORS.accent, fontSize: 11 }}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Scale size={24} color={COLORS.accent} />
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>JurisIA</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
              Agent juridique expert — {profile?.plan === 'gratuit' ? '3 questions/jour' : 'illimité'}
            </Text>
          </View>
        </View>
      </View>

      {messages.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Sparkles size={40} color={COLORS.secondary} />
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
              Pose ta question juridique
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
              Je cite mes sources et je te donne un indice de confiance
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                testID={`suggestion-${s.slice(0, 10)}`}
                onPress={() => sendMessage(s)}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 14 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      {loading && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          padding: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.bg,
          gap: 8,
        }}>
          <TextInput
            testID="jurisia-input"
            value={input}
            onChangeText={setInput}
            placeholder="Pose ta question juridique..."
            placeholderTextColor="#475569"
            multiline
            style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: '#FFF',
              fontSize: 15,
              maxHeight: 100,
            }}
          />
          <TouchableOpacity
            testID="jurisia-send"
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              backgroundColor: input.trim() ? COLORS.primary : COLORS.surface,
              borderRadius: 20,
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Send size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
