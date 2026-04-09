import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  User, Settings, HelpCircle, LogOut, ChevronRight, Shield,
  Wallet, Users, Star, Share2, Bell, Moon, Globe, FileText,
} from 'lucide-react-native'
import { useAuth } from '../../hooks/useAuth'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function ProfileScreen() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Es-tu sûr de vouloir te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ])
  }

  const sections = [
    {
      title: 'Compte',
      items: [
        { icon: Settings, label: 'Paramètres', route: '/settings' },
        { icon: Bell, label: 'Notifications', route: '/settings/notifications' },
        { icon: Moon, label: 'Apparence', route: '/settings/theme' },
        { icon: Globe, label: 'Langue', route: '/settings/lang' },
      ],
    },
    {
      title: 'Gains',
      items: [
        { icon: Wallet, label: 'Wallet', route: '/wallet' },
        { icon: Star, label: 'Points Purama', route: '/points' },
        { icon: Users, label: 'Parrainage', route: '/parrainage' },
        { icon: Share2, label: 'Partager', route: '/partage' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Aide & FAQ', route: '/aide' },
        { icon: FileText, label: 'Mentions légales', route: '/aide/legal' },
        { icon: Shield, label: 'Confidentialité', route: '/aide/privacy' },
      ],
    },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Profile header */}
        <Card style={{ marginBottom: 24, alignItems: 'center', padding: 24 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '30',
            justifyContent: 'center', alignItems: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 28 }}>
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '700' }}>
            {profile?.full_name ?? 'Utilisateur'}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 2 }}>
            {profile?.email}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Badge label={`Niveau ${profile?.level ?? 1}`} variant="primary" />
            <Badge label={`${profile?.xp ?? 0} XP`} variant="success" />
            <Badge label={profile?.plan ?? 'gratuit'} variant="info" />
          </View>
        </Card>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title} style={{ marginBottom: 20 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              {section.title}
            </Text>
            <Card style={{ padding: 0 }}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  testID={`profile-${item.label.toLowerCase()}`}
                  onPress={() => router.push(item.route as never)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 16,
                    borderBottomWidth: i < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <item.icon size={20} color={COLORS.primary} />
                  <Text style={{ color: COLORS.text, fontSize: 15, marginLeft: 12, flex: 1 }}>{item.label}</Text>
                  <ChevronRight size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity
          testID="btn-signout"
          onPress={handleSignOut}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 16, borderRadius: 12,
            backgroundColor: COLORS.error + '15', marginTop: 8,
          }}
        >
          <LogOut size={20} color={COLORS.error} />
          <Text style={{ color: COLORS.error, fontSize: 16, fontWeight: '600' }}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={{ color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          MOKSHA v1.0.0 — SASU PURAMA
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
