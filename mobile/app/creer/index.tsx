import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Building2, Users, ChevronRight, Sparkles } from 'lucide-react-native'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'

export default function CreerScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Sparkles size={40} color={COLORS.secondary} />
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800', marginTop: 12 }}>
            Que veux-tu créer ?
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
            En 10 minutes, 0 paperasse, 100% guidé
          </Text>
        </View>

        <TouchableOpacity
          testID="btn-entreprise"
          onPress={() => router.push('/creer/entreprise')}
          activeOpacity={0.8}
          style={{ marginBottom: 16 }}
        >
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primary + '20',
              justifyContent: 'center', alignItems: 'center', marginRight: 16,
            }}>
              <Building2 size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700' }}>Entreprise</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
                SASU, SAS, SARL, EURL, SCI, Micro
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          testID="btn-association"
          onPress={() => router.push('/creer/association')}
          activeOpacity={0.8}
        >
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.accent + '20',
              justifyContent: 'center', alignItems: 'center', marginRight: 16,
            }}>
              <Users size={28} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700' }}>Association</Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
                Loi 1901 — 6 types disponibles
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </Card>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
