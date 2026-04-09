import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { COLORS, FORMES_JURIDIQUES } from '../../lib/constants'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

const STEPS = ['Structure', 'Dénomination', 'Siège', 'Capital', 'Dirigeant', 'Récapitulatif']

export default function EntrepriseWizardScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    structure: '',
    denomination: '',
    nom_commercial: '',
    activite: '',
    adresse: '',
    type_local: 'domiciliation',
    capital: '1000',
    apport_type: 'numeraire',
    prenom: '',
    nom: '',
    date_naissance: '',
    nationalite: 'Française',
    adresse_dirigeant: '',
    express: false,
  })

  const updateForm = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canNext = () => {
    switch (step) {
      case 0: return !!form.structure
      case 1: return !!form.denomination && !!form.activite
      case 2: return !!form.adresse
      case 3: return !!form.capital
      case 4: return !!form.prenom && !!form.nom
      default: return true
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('demarches').insert({
        user_id: user?.id,
        type: 'entreprise',
        structure: form.structure,
        status: 'draft',
        data: form,
      })
      if (error) throw error
      Alert.alert('Démarche créée !', 'Ta démarche de création d\'entreprise a été enregistrée.', [
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
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
              Choisis ta structure
            </Text>
            {FORMES_JURIDIQUES.map((f) => (
              <TouchableOpacity
                key={f.id}
                testID={`structure-${f.id}`}
                onPress={() => updateForm('structure', f.id)}
                activeOpacity={0.8}
              >
                <Card style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderColor: form.structure === f.id ? COLORS.primary : COLORS.border,
                  borderWidth: form.structure === f.id ? 2 : 1,
                }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{f.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>{f.label}</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{f.description}</Text>
                  </View>
                  {form.structure === f.id && <Check size={20} color={COLORS.primary} />}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )
      case 1:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Dénomination</Text>
            <Input label="Dénomination sociale" placeholder="Ex: MOKSHA SAS" value={form.denomination} onChangeText={(v) => updateForm('denomination', v)} testID="input-denomination" />
            <Input label="Nom commercial (optionnel)" placeholder="Ex: MOKSHA" value={form.nom_commercial} onChangeText={(v) => updateForm('nom_commercial', v)} />
            <Input label="Activité principale" placeholder="Décris ton activité" value={form.activite} onChangeText={(v) => updateForm('activite', v)} multiline numberOfLines={3} testID="input-activite" />
          </View>
        )
      case 2:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Siège social</Text>
            <Input label="Adresse complète" placeholder="8 Rue de la Chapelle, 25560 Frasne" value={form.adresse} onChangeText={(v) => updateForm('adresse', v)} testID="input-adresse" />
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 }}>Type de local</Text>
            {['domiciliation', 'local_commercial', 'domicile'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => updateForm('type_local', t)}
                style={{
                  flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10,
                  backgroundColor: form.type_local === t ? COLORS.primary + '15' : COLORS.surface,
                  marginBottom: 8, borderWidth: 1,
                  borderColor: form.type_local === t ? COLORS.primary : COLORS.border,
                }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: form.type_local === t ? COLORS.primary : COLORS.textSecondary,
                  justifyContent: 'center', alignItems: 'center', marginRight: 12,
                }}>
                  {form.type_local === t && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary }} />}
                </View>
                <Text style={{ color: COLORS.text, fontSize: 14 }}>
                  {t === 'domiciliation' ? 'Domiciliation' : t === 'local_commercial' ? 'Local commercial' : 'Domicile personnel'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      case 3:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Capital social</Text>
            {form.structure !== 'micro' && (
              <>
                <Input label="Montant du capital (€)" placeholder="1000" value={form.capital} onChangeText={(v) => updateForm('capital', v)} keyboardType="numeric" testID="input-capital" />
                <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 8 }}>Type d'apport</Text>
                {['numeraire', 'nature', 'mixte'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => updateForm('apport_type', t)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10,
                      backgroundColor: form.apport_type === t ? COLORS.primary + '15' : COLORS.surface,
                      marginBottom: 8, borderWidth: 1,
                      borderColor: form.apport_type === t ? COLORS.primary : COLORS.border,
                    }}
                  >
                    <View style={{
                      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                      borderColor: form.apport_type === t ? COLORS.primary : COLORS.textSecondary,
                      justifyContent: 'center', alignItems: 'center', marginRight: 12,
                    }}>
                      {form.apport_type === t && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary }} />}
                    </View>
                    <Text style={{ color: COLORS.text, fontSize: 14 }}>
                      {t === 'numeraire' ? 'Numéraire (argent)' : t === 'nature' ? 'En nature (biens)' : 'Mixte'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {form.structure === 'micro' && (
              <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                Pas de capital social requis pour une micro-entreprise.
              </Text>
            )}
          </View>
        )
      case 4:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Dirigeant</Text>
            <Input label="Prénom" placeholder="Prénom" value={form.prenom} onChangeText={(v) => updateForm('prenom', v)} testID="input-prenom" />
            <Input label="Nom" placeholder="Nom" value={form.nom} onChangeText={(v) => updateForm('nom', v)} testID="input-nom" />
            <Input label="Date de naissance" placeholder="JJ/MM/AAAA" value={form.date_naissance} onChangeText={(v) => updateForm('date_naissance', v)} />
            <Input label="Nationalité" placeholder="Française" value={form.nationalite} onChangeText={(v) => updateForm('nationalite', v)} />
            <Input label="Adresse personnelle" placeholder="Adresse complète" value={form.adresse_dirigeant} onChangeText={(v) => updateForm('adresse_dirigeant', v)} />
          </View>
        )
      case 5:
        return (
          <View>
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Récapitulatif</Text>
            <Card style={{ gap: 12 }}>
              <Row label="Structure" value={FORMES_JURIDIQUES.find(f => f.id === form.structure)?.label ?? ''} />
              <Row label="Dénomination" value={form.denomination} />
              <Row label="Activité" value={form.activite} />
              <Row label="Siège" value={form.adresse} />
              {form.structure !== 'micro' && <Row label="Capital" value={`${form.capital} €`} />}
              <Row label="Dirigeant" value={`${form.prenom} ${form.nom}`} />
            </Card>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity testID="btn-back" onPress={() => step > 0 ? setStep(step - 1) : router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {STEPS.map((_, i) => (
              <View key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                backgroundColor: i <= step ? COLORS.primary : COLORS.surface,
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
          <Button
            testID="btn-next"
            title="Continuer"
            onPress={() => setStep(step + 1)}
            disabled={!canNext()}
            size="lg"
            icon={<ArrowRight size={20} color="#FFF" />}
          />
        ) : (
          <Button
            testID="btn-submit"
            title="Déposer ma démarche"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            icon={<Check size={20} color="#FFF" />}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  )
}
