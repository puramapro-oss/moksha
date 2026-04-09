import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Building2, Scale, FolderLock, Calculator, Bell, Gift, Users, Wallet, ChevronRight, Plus, Star } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'

type DashboardStats = {
  demarches: number
  documents: number
  rappels: number
  score: number | null
}

export default function DashboardScreen() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({ demarches: 0, documents: 0, rappels: 0, score: null })
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!user) return
    const [demarches, documents, rappels] = await Promise.all([
      supabase.from('demarches').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('rappels').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_completed', false),
    ])
    setStats({
      demarches: demarches.count ?? 0,
      documents: documents.count ?? 0,
      rappels: rappels.count ?? 0,
      score: null,
    })
  }, [user])

  useEffect(() => { fetchStats() }, [fetchStats])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refreshProfile(), fetchStats()])
    setRefreshing(false)
  }, [refreshProfile, fetchStats])

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20 }}>
        <Skeleton width="60%" height={28} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={16} style={{ marginBottom: 24 }} />
        <Skeleton height={120} style={{ marginBottom: 16 }} />
        <Skeleton height={120} />
      </SafeAreaView>
    )
  }

  const quickActions = [
    { icon: Building2, label: 'Créer', route: '/creer', color: COLORS.primary },
    { icon: Scale, label: 'JurisIA', route: '/(tabs)/jurisia', color: COLORS.accent },
    { icon: Calculator, label: 'Simuler', route: '/simulateur', color: COLORS.secondary },
    { icon: Bell, label: 'Rappels', route: '/rappels', color: '#8B5CF6' },
  ]

  const menuItems = [
    { icon: Users, label: 'Parrainage', route: '/parrainage', count: null },
    { icon: Wallet, label: 'Wallet', route: '/wallet', count: profile?.wallet_balance ? `${profile.wallet_balance}€` : null },
    { icon: Star, label: 'Points', route: '/points', count: profile?.purama_points ? `${profile.purama_points}` : null },
    { icon: Gift, label: 'Partage', route: '/partage', count: null },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>
            Salut {profile?.full_name?.split(' ')[0] ?? 'entrepreneur'} !
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Badge label={PLAN_LABEL_MAP[profile?.plan ?? 'gratuit']} variant={profile?.plan === 'pro' ? 'primary' : 'info'} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              Streak : {profile?.streak ?? 0} jours
            </Text>
          </View>
        </View>

        {/* CTA Créer */}
        <TouchableOpacity
          testID="btn-creer"
          onPress={() => router.push('/creer')}
          activeOpacity={0.9}
          style={{
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            overflow: 'hidden',
            backgroundColor: COLORS.primary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
                Crée ton entreprise
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                En 10 minutes, 0 paperasse
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 12 }}>
              <Plus size={24} color="#FFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              testID={`quick-${a.label.toLowerCase()}`}
              onPress={() => router.push(a.route as never)}
              style={{
                flex: 1,
                backgroundColor: COLORS.card,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <a.icon size={22} color={a.color} />
              <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '500' }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Démarches</Text>
            <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>{stats.demarches}</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Documents</Text>
            <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>{stats.documents}</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>Rappels</Text>
            <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>{stats.rappels}</Text>
          </Card>
        </View>

        {/* Menu Items */}
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            testID={`menu-${item.label.toLowerCase()}`}
            onPress={() => router.push(item.route as never)}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <item.icon size={20} color={COLORS.primary} />
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '500', marginLeft: 12, flex: 1 }}>
              {item.label}
            </Text>
            {item.count && (
              <Text style={{ color: COLORS.secondary, fontSize: 14, fontWeight: '600', marginRight: 8 }}>
                {item.count}
              </Text>
            )}
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const PLAN_LABEL_MAP: Record<string, string> = {
  gratuit: 'Gratuit',
  autopilote: 'Autopilote',
  pro: 'Pro',
}
