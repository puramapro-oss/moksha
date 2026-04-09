import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Moon, Globe, Bell, Shield, FileText, Trash2, LogOut } from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'

export default function SettingsScreen() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données seront supprimées conformément au RGPD.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {} },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card style={{ padding: 0, marginBottom: 20 }}>
          <SettingRow icon={Moon} label="Mode sombre" trailing={<Switch value={true} trackColor={{ true: COLORS.primary, false: '#333' }} />} />
          <SettingRow icon={Globe} label="Langue" trailing={<Text style={{ color: COLORS.textSecondary }}>Français</Text>} />
          <SettingRow icon={Bell} label="Notifications" trailing={<Switch value={true} trackColor={{ true: COLORS.primary, false: '#333' }} />} last />
        </Card>

        <Card style={{ padding: 0, marginBottom: 20 }}>
          <SettingRow icon={Shield} label="Politique de confidentialité" onPress={() => {}} />
          <SettingRow icon={FileText} label="Conditions d'utilisation" onPress={() => {}} />
          <SettingRow icon={FileText} label="Mentions légales" onPress={() => {}} last />
        </Card>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 16, borderRadius: 12,
            backgroundColor: COLORS.error + '10', marginBottom: 16,
          }}
        >
          <Trash2 size={18} color={COLORS.error} />
          <Text style={{ color: COLORS.error, fontSize: 14 }}>Supprimer mon compte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="btn-signout"
          onPress={signOut}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 16, borderRadius: 12, backgroundColor: COLORS.surface,
          }}
        >
          <LogOut size={18} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={{ color: COLORS.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 24 }}>
          MOKSHA v1.0.0 — SASU PURAMA — Art. 293B CGI
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function SettingRow({ icon: Icon, label, trailing, onPress, last }: {
  icon: typeof Moon; label: string; trailing?: React.ReactNode; onPress?: () => void; last?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: COLORS.border,
      }}
    >
      <Icon size={20} color={COLORS.primary} />
      <Text style={{ color: COLORS.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{label}</Text>
      {trailing}
    </TouchableOpacity>
  )
}
