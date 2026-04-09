import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FolderLock, Upload, FileText, Image as ImageIcon, Eye, Trash2, Plus } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { formatDate } from '../../lib/utils'

type Document = {
  id: string
  name: string
  category: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}

const CATEGORIES = ['statuts', 'pv', 'kbis', 'factures', 'contrats', 'identite', 'autre']

export default function ProofVaultScreen() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDocuments(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchDocuments()
    setRefreshing(false)
  }, [fetchDocuments])

  const uploadDocument = async (type: 'photo' | 'file') => {
    try {
      setUploading(true)
      let uri = ''
      let name = ''

      if (type === 'photo') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        })
        if (result.canceled) { setUploading(false); return }
        uri = result.assets[0].uri
        name = result.assets[0].fileName ?? `photo-${Date.now()}.jpg`
      } else {
        const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] })
        if (result.canceled) { setUploading(false); return }
        uri = result.assets[0].uri
        name = result.assets[0].name
      }

      const response = await fetch(uri)
      const blob = await response.blob()
      const filePath = `${user?.id}/${Date.now()}-${name}`

      const { error: uploadError } = await supabase.storage
        .from('moksha_documents')
        .upload(filePath, blob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('moksha_documents')
        .getPublicUrl(filePath)

      await supabase.from('documents').insert({
        user_id: user?.id,
        name,
        category: 'autre',
        file_url: publicUrl,
        file_type: name.endsWith('.pdf') ? 'pdf' : 'image',
        file_size: blob.size,
      })

      await fetchDocuments()
      Alert.alert('Document ajouté', `${name} a été importé dans ProofVault.`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      Alert.alert('Erreur', `Impossible d'importer le document : ${message}`)
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (doc: Document) => {
    Alert.alert('Supprimer', `Supprimer "${doc.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await supabase.from('documents').delete().eq('id', doc.id)
          setDocuments(prev => prev.filter(d => d.id !== doc.id))
        },
      },
    ])
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <FolderLock size={24} color={COLORS.secondary} />
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800' }}>ProofVault</Text>
          </View>
          <Badge label={`${documents.length} docs`} variant="info" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Upload buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            testID="upload-photo"
            onPress={() => uploadDocument('photo')}
            disabled={uploading}
            style={{
              flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
              alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border,
              borderStyle: 'dashed',
            }}
          >
            <ImageIcon size={24} color={COLORS.primary} />
            <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '500' }}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="upload-file"
            onPress={() => uploadDocument('file')}
            disabled={uploading}
            style={{
              flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
              alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border,
              borderStyle: 'dashed',
            }}
          >
            <Upload size={24} color={COLORS.accent} />
            <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '500' }}>Fichier</Text>
          </TouchableOpacity>
        </View>

        {documents.length === 0 ? (
          <EmptyState
            icon="📂"
            title="Ton coffre-fort est vide"
            description="Importe tes premiers documents pour les protéger et les organiser automatiquement."
          />
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: COLORS.primary + '20', borderRadius: 10, padding: 10, marginRight: 12,
              }}>
                <FileText size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                  {doc.name}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {formatSize(doc.file_size)} — {formatDate(doc.created_at)}
                </Text>
              </View>
              <Badge label={doc.category} variant="info" />
              <TouchableOpacity onPress={() => deleteDocument(doc)} style={{ marginLeft: 8, padding: 4 }}>
                <Trash2 size={16} color={COLORS.error} />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
