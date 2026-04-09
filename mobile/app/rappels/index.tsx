import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Bell, CheckCircle, Clock, AlertTriangle } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'

type Rappel = { id: string; title: string; description: string; due_date: string; type: string; is_completed: boolean }

export default function RappelsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [rappels, setRappels] = useState<Rappel[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchRappels = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('rappels')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
    setRappels(data ?? [])
  }, [user])

  useEffect(() => { fetchRappels() }, [fetchRappels])

  const toggleComplete = async (id: string, current: boolean) => {
    await supabase.from('rappels').update({ is_completed: !current }).eq('id', id)
    setRappels(prev => prev.map(r => r.id === id ? { ...r, is_completed: !current } : r))
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchRappels()
    setRefreshing(false)
  }, [fetchRappels])

  const isOverdue = (date: string) => new Date(date) < new Date()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Bell size={24} color="#8B5CF6" />
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Rappels</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        {rappels.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Aucun rappel"
            description="Tes rappels AG, TVA, URSSAF et comptes annuels apparaîtront ici automatiquement."
          />
        ) : (
          rappels.map((r) => (
            <TouchableOpacity key={r.id} onPress={() => toggleComplete(r.id, r.is_completed)} activeOpacity={0.8}>
              <Card style={{
                marginBottom: 10, flexDirection: 'row', alignItems: 'center',
                opacity: r.is_completed ? 0.5 : 1,
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18, marginRight: 12,
                  backgroundColor: r.is_completed ? '#22C55E20' : isOverdue(r.due_date) ? '#EF444420' : COLORS.surface,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  {r.is_completed ? (
                    <CheckCircle size={20} color="#22C55E" />
                  ) : isOverdue(r.due_date) ? (
                    <AlertTriangle size={20} color="#EF4444" />
                  ) : (
                    <Clock size={20} color={COLORS.textSecondary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: COLORS.text, fontSize: 14, fontWeight: '600',
                    textDecorationLine: r.is_completed ? 'line-through' : 'none',
                  }}>
                    {r.title}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {new Date(r.due_date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Badge
                  label={r.is_completed ? 'Fait' : isOverdue(r.due_date) ? 'En retard' : 'À faire'}
                  variant={r.is_completed ? 'success' : isOverdue(r.due_date) ? 'error' : 'warning'}
                />
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
