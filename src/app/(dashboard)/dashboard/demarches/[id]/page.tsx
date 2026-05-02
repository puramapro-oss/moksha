'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, FileText, Clock, CheckCircle2, Loader2, PenTool } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { Demarche, MokshaDocument } from '@/types'

export default function DemarcheDetail() {
  const params = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [demarche, setDemarche] = useState<Demarche | null>(null)
  const [documents, setDocuments] = useState<MokshaDocument[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id || !params?.id) return
    let stop = false
    const load = async () => {
      const [{ data: d }, { data: docs }] = await Promise.all([
        supabase.from('moksha_demarches').select('*').eq('id', params.id).eq('user_id', profile.id).single(),
        supabase.from('moksha_documents').select('*').eq('demarche_id', params.id).order('created_at', { ascending: true }),
      ])
      if (stop) return
      setDemarche(d as Demarche | null)
      setDocuments((docs as MokshaDocument[]) || [])
      setLoading(false)
    }
    load()
    // Poll toutes les 5s tant que la démarche est en cours de génération/traitement
    const interval = setInterval(() => {
      load()
    }, 5000)
    return () => {
      stop = true
      clearInterval(interval)
    }
  }, [profile?.id, params?.id, supabase])

  if (loading) return <div className="skeleton h-48 rounded-2xl" />
  if (!demarche)
    return (
      <div className="glass p-10 text-center text-white/60">
        Démarche introuvable —{' '}
        <Link href="/dashboard/demarches" className="text-[#FFB300] underline">
          retour à la liste
        </Link>
      </div>
    )

  const stages = [
    { key: 'brouillon', label: 'Dossier créé', icon: FileText },
    { key: 'documents_generes', label: 'Documents générés', icon: CheckCircle2 },
    { key: 'en_traitement', label: 'En traitement', icon: Loader2 },
    { key: 'depose_inpi', label: 'Déposé INPI', icon: Clock },
    { key: 'accepte', label: 'Accepté — Kbis reçu', icon: CheckCircle2 },
  ]
  const currentIndex = stages.findIndex((s) => s.key === demarche.statut)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/demarches"
        className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" /> Mes démarches
      </Link>

      <div>
        <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          {demarche.titre}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Créée le {new Date(demarche.created_at).toLocaleDateString('fr-FR')} — Mode {demarche.mode}
        </p>
      </div>

      <div className="glass p-6">
        <h2 className="mb-4 font-semibold">Progression</h2>
        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF3D00] to-[#FFB300] transition-all"
            style={{ width: `${demarche.avancement}%` }}
          />
        </div>
        <p className="text-right text-xs text-white/50">{demarche.avancement}%</p>

        <div className="mt-6 space-y-3">
          {stages.map((s, i) => {
            const done = currentIndex > i
            const active = currentIndex === i
            return (
              <div
                key={s.key}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  active ? 'border-[#FF3D00]/40 bg-[#FF3D00]/5' : done ? 'border-[#5DCAA5]/30 bg-[#5DCAA5]/5' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <s.icon
                  className={`h-5 w-5 ${done ? 'text-[#5DCAA5]' : active ? 'text-[#FF3D00]' : 'text-white/30'}`}
                />
                <span className={done || active ? 'font-medium' : 'text-white/50'}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {demarche.statut === 'documents_generes' && (
        <Link
          href={`/signer/${demarche.id}`}
          className="glass glass-hover flex items-center justify-between gap-4 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3D00] to-[#FFB300]">
              <PenTool className="h-5 w-5 text-[#070B18]" />
            </div>
            <div>
              <h3 className="font-semibold">Signer mon dossier</h3>
              <p className="text-xs text-white/50">Dernière étape avant le dépôt INPI</p>
            </div>
          </div>
          <span className="text-sm font-bold text-[#FFB300]">Signer →</span>
        </Link>
      )}

      {documents.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold">Documents ({documents.length})</h2>
          <div className="space-y-2">
            {documents.map((d) => (
              <a
                key={d.id}
                href={d.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover flex items-center justify-between p-4 text-sm"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[#FFB300]" />
                  <span>{d.nom}</span>
                </div>
                <span className="text-xs text-white/50">Ouvrir ↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {demarche.inpi_reference && (
        <div className="glass p-5 text-sm">
          <p className="text-white/50">Référence INPI</p>
          <p className="mt-1 font-mono text-[#FFB300]">{demarche.inpi_reference}</p>
        </div>
      )}

      {demarche.notes && (
        <div className="glass border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
          <p className="text-amber-300">⚠ {demarche.notes}</p>
        </div>
      )}
    </div>
  )
}
