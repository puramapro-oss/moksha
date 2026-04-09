import { View, Text, ScrollView, TouchableOpacity, Share, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Share2, MessageCircle, Mail, AtSign, Briefcase, Copy, Star } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../../hooks/useAuth'
import { COLORS, POINTS_REWARDS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'

export default function PartageScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const code = profile?.referral_code ?? 'MOKSHA-XXXXX'
  const link = `https://moksha.purama.dev/share/${code}`
  const message = `Crée ton entreprise en 10 min avec MOKSHA ! -50% avec mon code ${code}. ${link}`

  const shareNative = () => Share.share({ message })
  const shareWhatsApp = () => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`)
  const shareSMS = () => Linking.openURL(`sms:?body=${encodeURIComponent(message)}`)
  const shareTelegram = () => Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`)
  const shareTwitter = () => Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`)
  const shareLinkedIn = () => Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`)
  const shareMail = () => Linking.openURL(`mailto:?subject=${encodeURIComponent('Découvre MOKSHA')}&body=${encodeURIComponent(message)}`)
  const copyLink = () => Clipboard.setStringAsync(link)

  const channels = [
    { icon: Share2, label: 'Partager', onPress: shareNative, color: COLORS.primary },
    { icon: MessageCircle, label: 'WhatsApp', onPress: shareWhatsApp, color: '#25D366' },
    { icon: MessageCircle, label: 'SMS', onPress: shareSMS, color: '#3B82F6' },
    { icon: MessageCircle, label: 'Telegram', onPress: shareTelegram, color: '#0088CC' },
    { icon: AtSign, label: 'Twitter', onPress: shareTwitter, color: '#1DA1F2' },
    { icon: Briefcase, label: 'LinkedIn', onPress: shareLinkedIn, color: '#0077B5' },
    { icon: Mail, label: 'Email', onPress: shareMail, color: '#EA4335' },
    { icon: Copy, label: 'Copier', onPress: copyLink, color: COLORS.textSecondary },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Share2 size={24} color={COLORS.primary} />
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>Partager</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card style={{ alignItems: 'center', padding: 24, marginBottom: 24 }}>
          <Star size={32} color={COLORS.secondary} />
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 8 }}>
            +{POINTS_REWARDS.partage} points par partage
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            Maximum {POINTS_REWARDS.max_partage_jour} partages par jour
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {channels.map((ch) => (
            <TouchableOpacity
              key={ch.label}
              testID={`share-${ch.label.toLowerCase()}`}
              onPress={ch.onPress}
              style={{
                width: '47%', backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
                alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border,
              }}
            >
              <ch.icon size={24} color={ch.color} />
              <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '500' }}>{ch.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
