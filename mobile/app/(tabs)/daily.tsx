import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Gift, Sparkles, Star, Ticket, Percent, Zap } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'

type GiftResult = { type: string; value: string; description: string }

export default function DailyGiftScreen() {
  const { user, profile, refreshProfile } = useAuth()
  const [opened, setOpened] = useState(false)
  const [gift, setGift] = useState<GiftResult | null>(null)
  const [loading, setLoading] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  const openGift = async () => {
    if (loading || opened) return
    setLoading(true)

    Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start()

    try {
      const res = await fetch('https://moksha.purama.dev/api/daily-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      const data = await res.json()
      if (data.gift) {
        setGift(data.gift)
        setOpened(true)
        await refreshProfile()
      }
    } catch {
      setGift({ type: 'points', value: '10', description: '10 Points Purama offerts !' })
      setOpened(true)
    } finally {
      setLoading(false)
    }
  }

  const rotate = rotateAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-15deg', '0deg', '15deg'] })

  const giftIcons: Record<string, typeof Star> = {
    points: Star,
    coupon: Percent,
    ticket: Ticket,
    credits: Zap,
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 8 }}>
          Cadeau du jour
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 40, textAlign: 'center' }}>
          Reviens chaque jour pour accumuler tes récompenses !
        </Text>

        {/* Streak */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <View key={d} style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: (profile?.streak ?? 0) >= d ? COLORS.primary : COLORS.surface,
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 1, borderColor: (profile?.streak ?? 0) >= d ? COLORS.primary : COLORS.border,
            }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>{d}</Text>
            </View>
          ))}
        </View>

        {!opened ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate }] }}>
            <TouchableOpacity
              testID="daily-gift-open"
              onPress={openGift}
              disabled={loading}
              style={{
                width: 160, height: 160, borderRadius: 24,
                backgroundColor: COLORS.secondary + '20',
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 2, borderColor: COLORS.secondary,
              }}
            >
              <Gift size={64} color={COLORS.secondary} />
              <Text style={{ color: COLORS.secondary, fontSize: 16, fontWeight: '700', marginTop: 8 }}>
                {loading ? 'Ouverture...' : 'Ouvrir'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : gift ? (
          <Card style={{ width: '100%', alignItems: 'center', padding: 32 }}>
            <Sparkles size={40} color={COLORS.secondary} />
            <Text style={{ color: COLORS.secondary, fontSize: 32, fontWeight: '800', marginTop: 12 }}>
              {gift.value}
            </Text>
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
              {gift.description}
            </Text>
          </Card>
        ) : null}

        <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 24, textAlign: 'center' }}>
          Points Purama : {profile?.purama_points ?? 0}
        </Text>
      </View>
    </SafeAreaView>
  )
}
