import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react-native'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'

const FAQ = [
  { q: 'Comment créer mon entreprise avec MOKSHA ?', a: 'Clique sur "Créer" depuis le dashboard, choisis ta structure juridique, et suis le wizard en 6 étapes. Tout est guidé et automatisé.' },
  { q: 'Combien coûte la création d\'entreprise ?', a: 'MOKSHA propose 3 plans : Gratuit (modèles + JurisIA 3q/jour), Autopilote à 19€/mois (tout inclus + dépôt INPI), et Pro à 49€/mois (multi-structures + API).' },
  { q: 'Qu\'est-ce que JurisIA ?', a: 'JurisIA est ton agent juridique IA expert. Il répond à toutes tes questions sur la création d\'entreprise, les statuts, la fiscalité, avec des sources officielles (Legifrance, INPI).' },
  { q: 'Comment fonctionne ProofVault ?', a: 'ProofVault est ton coffre-fort numérique. Importe tes documents (statuts, Kbis, factures), ils sont automatiquement classés, horodatés et sécurisés (AES-256).' },
  { q: 'Comment parrainer un ami ?', a: 'Va dans "Parrainage", copie ton code unique et partage-le. Tu gagnes 50% du 1er paiement + 10% récurrent à vie pour chaque filleul.' },
  { q: 'Comment retirer mes gains ?', a: 'Depuis ton Wallet, clique sur "Retirer" une fois que tu as atteint le minimum de 20€. Le virement IBAN est traité sous 3-5 jours.' },
  { q: 'Qu\'est-ce que la Garantie Zéro Refus ?', a: 'Si ta démarche est refusée par l\'INPI, nous corrigeons et redéposons gratuitement jusqu\'à acceptation. Aucun frais supplémentaire.' },
  { q: 'MOKSHA remplace-t-il un avocat ?', a: 'Non. MOKSHA et JurisIA sont des outils d\'aide à la décision. Pour des situations complexes, nous recommandons de consulter un professionnel du droit.' },
]

export default function AideScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filtered = FAQ.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <HelpCircle size={24} color={COLORS.accent} />
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Aide & FAQ</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
          borderRadius: 12, paddingHorizontal: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border,
        }}>
          <Search size={18} color={COLORS.textSecondary} />
          <TextInput
            testID="faq-search"
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher..."
            placeholderTextColor="#475569"
            style={{ flex: 1, padding: 12, color: '#FFF', fontSize: 15 }}
          />
        </View>

        {filtered.map((item, i) => (
          <TouchableOpacity key={i} onPress={() => setOpenIndex(openIndex === i ? null : i)} activeOpacity={0.8}>
            <Card style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{item.q}</Text>
                {openIndex === i ? <ChevronUp size={18} color={COLORS.textSecondary} /> : <ChevronDown size={18} color={COLORS.textSecondary} />}
              </View>
              {openIndex === i && (
                <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 12, lineHeight: 20 }}>
                  {item.a}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          testID="btn-contact"
          onPress={() => router.push('/(tabs)/jurisia' as never)}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 16, borderRadius: 12, backgroundColor: COLORS.primary, marginTop: 16,
          }}
        >
          <MessageCircle size={20} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Parler à JurisIA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
