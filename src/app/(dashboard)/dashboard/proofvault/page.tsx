'use client'

import { useEffect, useState, useRef } from 'react'
import { Upload, FileText, Lock, Check, AlertTriangle, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { MokshaDocument } from '@/types'

export default function ProofVault() {
  const { profile } = useAuth()
  const [docs, setDocs] = useState<MokshaDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('moksha_documents')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setDocs((data as MokshaDocument[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return
    setUploading(true)

    try {
      // ScannerPerfect côté client : check mime + size
      const valid = file.type.startsWith('image/') || file.type === 'application/pdf'
      if (!valid) {
        toast.error('Formats acceptés : images ou PDF')
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 20 Mo)')
        return
      }

      const scanner_score = file.size < 100_000 ? 'attention' : 'parfait'

      const path = `${profile.id}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('moksha_documents').upload(path, file)
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('moksha_documents').getPublicUrl(path)

      const { error: insErr } = await supabase.from('moksha_documents').insert({
        user_id: profile.id,
        nom: file.name,
        type: 'autre',
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        scanner_score,
      })
      if (insErr) throw insErr

      toast.success('Document ajouté au coffre')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload impossible')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
            ProofVault
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
            <Lock className="h-3.5 w-3.5 text-[#5DCAA5]" />
            Chiffré AES-256 — timeline horodatée
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18] disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Upload...' : 'Ajouter un document'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleUpload} className="hidden" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : docs.length === 0 ? (
        <div
          className="glass flex cursor-pointer flex-col items-center gap-3 py-16 text-center transition hover:bg-white/[0.04]"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-white/30" />
          <p className="text-white/60">L&apos;espace de toutes les possibilités. Glisse un fichier ici ou clique pour ajouter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {docs.map((d) => (
            <div key={d.id} className="glass glass-hover p-5">
              <div className="mb-4 flex items-start justify-between">
                <FileText className="h-6 w-6 text-[#FFD700]" />
                {d.scanner_score === 'parfait' && (
                  <div className="flex items-center gap-1 rounded-full bg-[#5DCAA5]/15 px-2 py-0.5 text-[10px] text-[#5DCAA5]">
                    <Check className="h-3 w-3" /> Parfait
                  </div>
                )}
                {d.scanner_score === 'attention' && (
                  <div className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">
                    <AlertTriangle className="h-3 w-3" /> À vérifier
                  </div>
                )}
              </div>
              <h3 className="mb-1 truncate font-medium text-sm">{d.nom}</h3>
              <p className="text-[11px] text-white/40">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
              <div className="mt-4 flex gap-2">
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noopener"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-[11px] transition hover:bg-white/10"
                >
                  <Download className="h-3 w-3" /> Voir
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(d.file_url)
                    toast.success('Lien copié')
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-[11px] transition hover:bg-white/10"
                >
                  <Share2 className="h-3 w-3" /> Partager
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
