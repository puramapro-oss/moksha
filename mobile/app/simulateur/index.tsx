import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Calculator, TrendingUp } from 'lucide-react-native'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

type SimResult = { structure: string; revenu_net: number; charges: number; impots: number; total_cout: number }

export default function SimulateurScreen() {
  const router = useRouter()
  const [ca, setCa] = useState('')
  const [results, setResults] = useState<SimResult[]>([])

  const simulate = () => {
    const caNum = parseInt(ca) || 0
    if (caNum <= 0) return

    const sims: SimResult[] = [
      {
        structure: 'Micro-entreprise',
        charges: Math.round(caNum * 0.22),
        impots: Math.round((caNum - caNum * 0.22) * 0.11),
        revenu_net: Math.round(caNum - caNum * 0.22 - (caNum - caNum * 0.22) * 0.11),
        total_cout: Math.round(caNum * 0.22 + (caNum - caNum * 0.22) * 0.11),
      },
      {
        structure: 'SASU (président)',
        charges: Math.round(caNum * 0.45 * 0.82),
        impots: Math.round(caNum * 0.55 * 0.15),
        revenu_net: Math.round(caNum - caNum * 0.45 * 0.82 - caNum * 0.55 * 0.15),
        total_cout: Math.round(caNum * 0.45 * 0.82 + caNum * 0.55 * 0.15),
      },
      {
        structure: 'EURL (IR)',
        charges: Math.round(caNum * 0.45),
        impots: Math.round((caNum - caNum * 0.45) * 0.14),
        revenu_net: Math.round(caNum - caNum * 0.45 - (caNum - caNum * 0.45) * 0.14),
        total_cout: Math.round(caNum * 0.45 + (caNum - caNum * 0.45) * 0.14),
      },
    ]

    setResults(sims.sort((a, b) => b.revenu_net - a.revenu_net))
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Calculator size={24} color={COLORS.secondary} />
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Simulateur fiscal</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 20 }}>
          Compare les statuts juridiques selon ton chiffre d'affaires prévu.
        </Text>

        <Input
          testID="input-ca"
          label="Chiffre d'affaires annuel prévu (€)"
          placeholder="50000"
          value={ca}
          onChangeText={setCa}
          keyboardType="numeric"
        />

        <Button
          testID="btn-simulate"
          title="Simuler"
          onPress={simulate}
          size="lg"
          style={{ marginBottom: 24 }}
          icon={<TrendingUp size={20} color="#FFF" />}
        />

        {results.map((r, i) => (
          <Card key={r.structure} style={{ marginBottom: 12, borderColor: i === 0 ? COLORS.accent : COLORS.border, borderWidth: i === 0 ? 2 : 1 }}>
            {i === 0 && (
              <View style={{ backgroundColor: COLORS.accent + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 8 }}>
                <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '600' }}>MEILLEUR CHOIX</Text>
              </View>
            )}
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>{r.structure}</Text>
            <View style={{ gap: 6 }}>
              <Row label="Revenu net" value={`${r.revenu_net.toLocaleString('fr-FR')} €`} highlight />
              <Row label="Charges sociales" value={`${r.charges.toLocaleString('fr-FR')} €`} />
              <Row label="Impôts" value={`${r.impots.toLocaleString('fr-FR')} €`} />
              <Row label="Coût total" value={`${r.total_cout.toLocaleString('fr-FR')} €`} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: highlight ? COLORS.accent : COLORS.text, fontSize: 14, fontWeight: highlight ? '700' : '500' }}>{value}</Text>
    </View>
  )
}
