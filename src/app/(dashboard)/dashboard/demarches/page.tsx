'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { Demarche } from '@/types'

const statutLabel: Record<Demarche['statut'], { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-white/10 text-white/70' },
  documents_generes: { label: 'Documents générés', color: 'bg-[#FFD700]/15 text-[#FFD700]' },
  en_traitement: { label: 'En traitement', color: 'bg-[#FF6B35]/15 text-[#FF6B35]' },
  depose_inpi: { label: 'Déposé INPI', color: 'bg-[#FF6B35]/20 text-[#FF6B35]' },
  accepte: { label: 'Accepté', color: 'bg-[#5DCAA5]/15 text-[#5DCAA5]' },
  refuse: { label: 'Refusé', color: 'bg-red-500/15 text-red-400' },
  regularisation: { label: 'Régularisation', color: 'bg-amber-500/15 text-amber-300' },
}

export default function Demarches() {
  const { profile } = useAuth()
  const [demarches, setDemarches] = useState<Demarche[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data } = await supabase
        .from('moksha_demarches')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setDemarches((data as Demarche[]) || [])
      setLoading(false)
    }
    load()
  }, [profile?.id, supabase])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
            Mes démarches
          </h1>
          <p className="mt-1 text-sm text-white/60">Suivi en temps réel de tes dossiers MOKSHA.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/demarches/aides-creation"
            className="hidden items-center gap-2 rounded-xl border border-[#5DCAA5]/30 bg-[#5DCAA5]/10 px-4 py-2.5 text-sm font-semibold text-[#5DCAA5] transition hover:bg-[#5DCAA5]/15 md:inline-flex"
          >
            ✨ Aides à la création
          </Link>
          <Link
            href="/creer/entreprise"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18]"
          >
            <Plus className="h-4 w-4" /> Nouvelle démarche
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : demarches.length === 0 ? (
        <div className="glass flex flex-col items-center gap-4 py-16 text-center">
          <FileText className="h-10 w-10 text-white/30" />
          <p className="text-white/60">Aucune démarche pour l&apos;instant.</p>
          <Link
            href="/creer/entreprise"
            className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18]"
          >
            Démarrer ma première création
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {demarches.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/demarches/${d.id}`}
              className="glass glass-hover flex items-center justify-between gap-4 p-5"
            >
              <div className="flex items-center gap-4">
                <FileText className="h-6 w-6 text-[#FF6B35]" />
                <div>
                  <h3 className="font-semibold">{d.titre}</h3>
                  <p className="text-xs text-white/50">
                    {new Date(d.created_at).toLocaleDateString('fr-FR')} — Mode {d.mode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statutLabel[d.statut].color}`}>
                  {statutLabel[d.statut].label}
                </span>
                <span className="text-xs text-white/50">{d.avancement}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
