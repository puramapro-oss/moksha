import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Star, ShoppingBag } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { COLORS, POINTS_REWARDS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'

const SHOP_ITEMS = [
  { label: '-10% sur votre prochain mois', cost: 1000 },
  { label: '-30% sur votre prochain mois', cost: 3000 },
  { label: '-50% sur votre prochain mois', cost: 5000 },
  { label: '1 mois GRATUIT', cost: 10000 },
  { label: '1 ticket tirage mensuel', cost: 500 },
  { label: '1€ en wallet', cost: 10000 },
]

export default function PointsScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const points = profile?.purama_points ?? 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Star size={24} color={COLORS.secondary} />
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Points Purama</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card style={{ alignItems: 'center', padding: 32, marginBottom: 24 }}>
          <Star size={40} color={COLORS.secondary} />
          <Text style={{ color: COLORS.secondary, fontSize: 40, fontWeight: '800', marginTop: 8 }}>{points}</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Points Purama</Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>
            = {(points * 0.01).toFixed(2)}€
          </Text>
        </Card>

        <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Comment gagner
        </Text>
        <Card style={{ marginBottom: 24, gap: 8 }}>
          {[
            { label: 'Inscription', pts: POINTS_REWARDS.inscription },
            { label: 'Parrainage', pts: POINTS_REWARDS.parrainage },
            { label: 'Streak quotidien', pts: POINTS_REWARDS.streak_daily },
            { label: 'Partage', pts: POINTS_REWARDS.partage },
            { label: 'Feedback', pts: POINTS_REWARDS.feedback },
            { label: 'Achievement', pts: POINTS_REWARDS.achievement },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.text, fontSize: 14 }}>{item.label}</Text>
              <Text style={{ color: COLORS.secondary, fontSize: 14, fontWeight: '600' }}>+{item.pts} pts</Text>
            </View>
          ))}
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShoppingBag size={18} color={COLORS.primary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
            Boutique
          </Text>
        </View>
        {SHOP_ITEMS.map((item) => (
          <Card key={item.label} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 14 }}>{item.label}</Text>
            </View>
            <TouchableOpacity
              disabled={points < item.cost}
              style={{
                backgroundColor: points >= item.cost ? COLORS.primary : COLORS.surface,
                borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
              }}
            >
              <Text style={{ color: points >= item.cost ? '#FFF' : COLORS.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {item.cost} pts
              </Text>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
