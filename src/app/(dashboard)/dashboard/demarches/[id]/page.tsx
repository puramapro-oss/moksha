'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, FileText, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { Demarche } from '@/types'

export default function DemarcheDetail() {
  const params = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [demarche, setDemarche] = useState<Demarche | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id || !params?.id) return
    const load = async () => {
      const { data } = await supabase
        .from('moksha_demarches')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', profile.id)
        .single()
      setDemarche(data as Demarche | null)
      setLoading(false)
    }
    load()
  }, [profile?.id, params?.id, supabase])

  if (loading) return <div className="skeleton h-48 rounded-2xl" />
  if (!demarche)
    return (
      <div className="glass p-10 text-center text-white/60">
        Démarche introuvable —{' '}
        <Link href="/dashboard/demarches" className="text-[#FFD700] underline">
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
            className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] transition-all"
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
                  active ? 'border-[#FF6B35]/40 bg-[#FF6B35]/5' : done ? 'border-[#5DCAA5]/30 bg-[#5DCAA5]/5' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <s.icon
                  className={`h-5 w-5 ${done ? 'text-[#5DCAA5]' : active ? 'text-[#FF6B35]' : 'text-white/30'}`}
                />
                <span className={done || active ? 'font-medium' : 'text-white/50'}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {demarche.inpi_reference && (
        <div className="glass p-5 text-sm">
          <p className="text-white/50">Référence INPI</p>
          <p className="mt-1 font-mono text-[#FFD700]">{demarche.inpi_reference}</p>
        </div>
      )}
    </div>
  )
}
