'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

type AdminDemarche = {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: string
  titre: string
  mode: 'standard' | 'express'
  statut: string
  avancement: number
  inpi_reference: string | null
  created_at: string
  updated_at: string
}

const STATUTS = ['brouillon', 'documents_generes', 'en_traitement', 'depose_inpi', 'accepte', 'refuse', 'regularisation']

export default function AdminDemarches() {
  const [list, setList] = useState<AdminDemarche[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/demarches${filter ? `?statut=${filter}` : ''}`)
    if (r.ok) {
      const d = (await r.json()) as { demarches: AdminDemarche[] }
      setList(d.demarches)
    } else toast.error('Chargement impossible')
    setLoading(false)
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  async function setStatut(id: string, statut: string) {
    const r = await fetch('/api/admin/demarches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut }),
    })
    if (r.ok) {
      toast.success('Statut mis à jour')
      setList((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)))
    } else toast.error('Échec')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          Démarches
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : list.length === 0 ? (
        <div className="glass p-10 text-center text-sm text-white/60">Aucune démarche.</div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div key={d.id} className="glass flex flex-col gap-3 p-4 text-sm md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.titre}</p>
                <p className="text-[11px] text-white/50">
                  {d.user_email} • {d.type} • {d.mode}
                  {d.inpi_reference && ` • INPI: ${d.inpi_reference}`}
                </p>
                <p className="text-[10px] text-white/40">{new Date(d.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right text-[10px] text-white/50">{d.avancement}%</div>
                <select
                  value={d.statut}
                  onChange={(e) => setStatut(d.id, e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs"
                >
                  {STATUTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
