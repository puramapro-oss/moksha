import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Wallet, ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { COLORS, WALLET_MIN_WITHDRAWAL } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'

type Transaction = { id: string; amount: number; type: string; description: string; created_at: string }

export default function WalletScreen() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions(data ?? [])
  }, [user])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refreshProfile(), fetchTransactions()])
    setRefreshing(false)
  }, [refreshProfile, fetchTransactions])

  const balance = profile?.wallet_balance ?? 0
  const canWithdraw = balance >= WALLET_MIN_WITHDRAWAL

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Wallet size={24} color={COLORS.secondary} />
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <Card style={{ alignItems: 'center', padding: 32, marginBottom: 20 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Solde disponible</Text>
          <Text style={{ color: COLORS.secondary, fontSize: 40, fontWeight: '800', marginTop: 4 }}>
            {balance.toFixed(2)} €
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 8 }}>
            Retrait dès {WALLET_MIN_WITHDRAWAL}€ par IBAN
          </Text>
          <Button
            testID="btn-withdraw"
            title={canWithdraw ? 'Retirer' : `Minimum ${WALLET_MIN_WITHDRAWAL}€`}
            onPress={() => {}}
            disabled={!canWithdraw}
            variant={canWithdraw ? 'primary' : 'outline'}
            size="sm"
            style={{ marginTop: 16 }}
            icon={<Banknote size={16} color={canWithdraw ? '#FFF' : COLORS.primary} />}
          />
        </Card>

        <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Historique
        </Text>
        {transactions.length === 0 ? (
          <EmptyState icon="💰" title="Aucune transaction" description="Tes commissions de parrainage et gains de concours apparaîtront ici." />
        ) : (
          transactions.map((tx) => (
            <Card key={tx.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18, marginRight: 12,
                backgroundColor: tx.amount > 0 ? '#22C55E20' : '#EF444420',
                justifyContent: 'center', alignItems: 'center',
              }}>
                {tx.amount > 0 ? <ArrowDownLeft size={18} color="#22C55E" /> : <ArrowUpRight size={18} color="#EF4444" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '500' }}>{tx.description}</Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                  {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={{ color: tx.amount > 0 ? '#22C55E' : '#EF4444', fontSize: 16, fontWeight: '700' }}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}€
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
