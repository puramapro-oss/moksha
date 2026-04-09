import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Share, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Users, Copy, Share2, Gift } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export default function ParrainageScreen() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [referrals, setReferrals] = useState<{ id: string; email: string; created_at: string }[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchReferrals = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('referrals')
      .select('id, referred_email, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
    setReferrals((data ?? []).map(r => ({ id: r.id, email: r.referred_email, created_at: r.created_at })))
  }, [user])

  useEffect(() => { fetchReferrals() }, [fetchReferrals])

  const code = profile?.referral_code ?? 'MOKSHA-XXXXX'
  const link = `https://moksha.purama.dev/share/${code}`

  const copyCode = async () => { await Clipboard.setStringAsync(code) }
  const shareLink = async () => {
    await Share.share({
      message: `Crée ton entreprise en 10 minutes avec MOKSHA ! Utilise mon code ${code} pour -50% sur ton 1er mois.\n${link}`,
    })
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchReferrals()
    setRefreshing(false)
  }, [fetchReferrals])

  const tierLabel = (count: number) => {
    if (count >= 100) return 'Légende'
    if (count >= 75) return 'Diamant'
    if (count >= 50) return 'Platine'
    if (count >= 25) return 'Or'
    if (count >= 10) return 'Argent'
    if (count >= 5) return 'Bronze'
    return 'Débutant'
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Users size={24} color={COLORS.primary} />
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Parrainage</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Filleuls</Text>
            <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>{referrals.length}</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Niveau</Text>
            <Text style={{ color: COLORS.secondary, fontSize: 16, fontWeight: '700' }}>{tierLabel(referrals.length)}</Text>
          </Card>
        </View>

        <Card style={{ marginBottom: 20 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>Ton code parrainage</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ color: COLORS.secondary, fontSize: 18, fontWeight: '800', textAlign: 'center', letterSpacing: 2 }}>
                {code}
              </Text>
            </View>
            <TouchableOpacity testID="btn-copy" onPress={copyCode} style={{ backgroundColor: COLORS.surface, borderRadius: 10, padding: 14 }}>
              <Copy size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Button testID="btn-share" title="Partager mon lien" onPress={shareLink} size="lg" icon={<Share2 size={20} color="#FFF" />} style={{ marginBottom: 24 }} />

        <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Tes filleuls ({referrals.length})
        </Text>
        {referrals.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: 32 }}>
            <Gift size={40} color={COLORS.textSecondary} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              Partage ton code pour gagner des commissions sur chaque inscription !
            </Text>
          </Card>
        ) : (
          referrals.map((r) => (
            <Card key={r.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14 }}>{r.email}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Badge label="Actif" variant="success" />
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
