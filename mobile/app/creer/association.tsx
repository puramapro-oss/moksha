import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { COLORS, TYPES_ASSOCIATIONS } from '../../lib/constants'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

const STEPS = ['Type', 'Nom & Objet', 'Siège', 'Bureau', 'Récapitulatif']

export default function AssociationWizardScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: '',
    nom: '',
    objet: '',
    adresse: '',
    president: '',
    secretaire: '',
    tresorier: '',
  })

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canNext = () => {
    switch (step) {
      case 0: return !!form.type
      case 1: return !!form.nom && !!form.objet
      case 2: return !!form.adresse
      case 3: return !!form.president
      default: return true
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('demarches').insert({
        user_id: user?.id,
        type: 'association',
        structure: form.type,
        status: 'draft',
        data: form,
      })
      if (error) throw error
      Alert.alert('Démarche créée !', 'Ta démarche de création d\'association a été enregistrée.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      Alert.alert('Erreur', message)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={{ gap: 10 }}>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>Type d'association</Text>
            {TYPES_ASSOCIATIONS.map((t) => (
              <TouchableOpacity key={t.id} testID={`type-${t.id}`} onPress={() => updateForm('type', t.id)} activeOpacity={0.8}>
                <Card style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderColor: form.type === t.id ? COLORS.accent : COLORS.border,
                  borderWidth: form.type === t.id ? 2 : 1,
                }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{t.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>{t.label}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{t.description}</Text>
                  </View>
                  {form.type === t.id && <Check size={20} color={COLORS.accent} />}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )
      case 1:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Nom & Objet</Text>
            <Input label="Nom de l'association" placeholder="Ex: Association Lumière" value={form.nom} onChangeText={(v) => updateForm('nom', v)} testID="input-nom" />
            <Input label="Objet social" placeholder="Décris l'objet de ton association" value={form.objet} onChangeText={(v) => updateForm('objet', v)} multiline numberOfLines={4} testID="input-objet" />
          </View>
        )
      case 2:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Siège social</Text>
            <Input label="Adresse complète" placeholder="Adresse du siège" value={form.adresse} onChangeText={(v) => updateForm('adresse', v)} testID="input-adresse" />
          </View>
        )
      case 3:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Bureau</Text>
            <Input label="Président(e)" placeholder="Prénom Nom" value={form.president} onChangeText={(v) => updateForm('president', v)} testID="input-president" />
            <Input label="Secrétaire (optionnel)" placeholder="Prénom Nom" value={form.secretaire} onChangeText={(v) => updateForm('secretaire', v)} />
            <Input label="Trésorier(e) (optionnel)" placeholder="Prénom Nom" value={form.tresorier} onChangeText={(v) => updateForm('tresorier', v)} />
          </View>
        )
      case 4:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Récapitulatif</Text>
            <Card style={{ gap: 12 }}>
              <Row label="Type" value={TYPES_ASSOCIATIONS.find(t => t.id === form.type)?.label ?? ''} />
              <Row label="Nom" value={form.nom} />
              <Row label="Objet" value={form.objet} />
              <Row label="Siège" value={form.adresse} />
              <Row label="Président(e)" value={form.president} />
              {form.secretaire && <Row label="Secrétaire" value={form.secretaire} />}
              {form.tresorier && <Row label="Trésorier(e)" value={form.tresorier} />}
            </Card>
          </View>
        )
      default: return null
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {STEPS.map((_, i) => (
              <View key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                backgroundColor: i <= step ? COLORS.accent : COLORS.surface,
              }} />
            ))}
          </View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 6 }}>
            Étape {step + 1}/{STEPS.length} — {STEPS[step]}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {renderStep()}
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20, paddingBottom: 40, backgroundColor: COLORS.bg,
        borderTopWidth: 1, borderTopColor: COLORS.border,
      }}>
        {step < STEPS.length - 1 ? (
          <Button title="Continuer" onPress={() => setStep(step + 1)} disabled={!canNext()} size="lg" icon={<ArrowRight size={20} color="#FFF" />} />
        ) : (
          <Button title="Créer mon association" onPress={handleSubmit} loading={loading} size="lg" variant="secondary" icon={<Check size={20} color="#070B18" />} />
        )}
      </View>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' }} numberOfLines={2}>{value}</Text>
    </View>
  )
}
