'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { Structure } from '@/types'

export default function Structures() {
  const { profile } = useAuth()
  const [structures, setStructures] = useState<Structure[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data } = await supabase
        .from('moksha_structures')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setStructures((data as Structure[]) || [])
      setLoading(false)
    }
    load()
  }, [profile?.id, supabase])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
            <Building2 className="h-6 w-6 text-[#FFD700]" /> Mes structures
          </h1>
          <p className="mt-1 text-sm text-white/60">Entreprises et associations que tu gères.</p>
        </div>
        <Link
          href="/demarrer"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18]"
        >
          <Plus className="h-4 w-4" /> Nouvelle structure
        </Link>
      </div>
      {loading ? (
        <div className="skeleton h-32 rounded-2xl" />
      ) : structures.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 py-14 text-center">
          <Building2 className="h-10 w-10 text-white/30" />
          <p className="text-white/60">Aucune structure pour l&apos;instant.</p>
          <Link
            href="/demarrer"
            className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18]"
          >
            Créer ma première structure
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {structures.map((s) => (
            <div key={s.id} className="glass p-5">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/50">
                <span className="rounded-full bg-white/5 px-2 py-0.5">{s.type}</span>
                {s.forme && <span className="rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-[#FF6B35]">{s.forme.toUpperCase()}</span>}
              </div>
              <h3 className="font-display text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {s.denomination || 'Sans nom'}
              </h3>
              <p className="mt-2 text-xs text-white/50">{s.activite || '—'}</p>
              {s.siren && <p className="mt-2 font-mono text-xs text-[#FFD700]">SIREN {s.siren}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
