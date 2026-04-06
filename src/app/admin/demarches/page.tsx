'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Demarche } from '@/types'

export default function AdminDemarches() {
  const [list, setList] = useState<Demarche[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('moksha_demarches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      setList((data as Demarche[]) || [])
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>Démarches</h1>
      {loading ? (
        <div className="skeleton h-32 rounded-2xl" />
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div key={d.id} className="glass flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{d.titre}</p>
                <p className="text-[11px] text-white/50">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-[10px] text-[#FF6B35]">{d.statut}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
