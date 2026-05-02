'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type Concours = {
  id: string
  titre: string
  description: string | null
  type: 'meilleur_parrain' | 'premiere_creation' | 'defi_mensuel'
  date_debut: string
  date_fin: string
  prix: Array<{ rang: number; montant: number; label?: string }>
  actif: boolean
  participants_count: number
}

export default function AdminConcours() {
  const [list, setList] = useState<Concours[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    titre: '',
    description: '',
    type: 'meilleur_parrain' as Concours['type'],
    date_debut: '',
    date_fin: '',
    prix1: 500,
    prix2: 250,
    prix3: 100,
  })

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/admin/concours')
    if (r.ok) {
      const d = (await r.json()) as { concours: Concours[] }
      setList(d.concours)
    } else toast.error('Chargement impossible')
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre || !form.date_debut || !form.date_fin) {
      toast.error('Titre, dates requis')
      return
    }
    const r = await fetch('/api/admin/concours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: form.titre,
        description: form.description,
        type: form.type,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        prix: [
          { rang: 1, montant: form.prix1, label: '1er' },
          { rang: 2, montant: form.prix2, label: '2e' },
          { rang: 3, montant: form.prix3, label: '3e' },
        ],
      }),
    })
    if (r.ok) {
      toast.success('Concours créé')
      setForm({ ...form, titre: '', description: '', date_debut: '', date_fin: '' })
      load()
    } else toast.error('Échec création')
  }

  async function toggle(c: Concours) {
    const r = await fetch('/api/admin/concours', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, actif: !c.actif }),
    })
    if (r.ok) {
      toast.success(c.actif ? 'Désactivé' : 'Activé')
      load()
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce concours ?')) return
    const r = await fetch(`/api/admin/concours?id=${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Supprimé')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        Concours
      </h1>

      <form onSubmit={create} className="glass space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Créer un concours
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder="Titre"
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
          />
          <select
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Concours['type'] })}
          >
            <option value="meilleur_parrain">Meilleur parrain</option>
            <option value="premiere_creation">Première création</option>
            <option value="defi_mensuel">Défi mensuel</option>
          </select>
          <input
            type="date"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={form.date_debut}
            onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
          />
          <input
            type="date"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={form.date_fin}
            onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
          />
          <textarea
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm md:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="md:col-span-2 grid grid-cols-3 gap-3">
            <label className="text-xs text-white/60">
              Prix 1er (€)
              <input type="number" min={0} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" value={form.prix1} onChange={(e) => setForm({ ...form, prix1: Number(e.target.value) })} />
            </label>
            <label className="text-xs text-white/60">
              Prix 2e (€)
              <input type="number" min={0} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" value={form.prix2} onChange={(e) => setForm({ ...form, prix2: Number(e.target.value) })} />
            </label>
            <label className="text-xs text-white/60">
              Prix 3e (€)
              <input type="number" min={0} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" value={form.prix3} onChange={(e) => setForm({ ...form, prix3: Number(e.target.value) })} />
            </label>
          </div>
        </div>
        <button className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-2.5 text-sm font-bold text-[#070B18]">
          Créer le concours
        </button>
      </form>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
          <Trophy className="h-4 w-4" /> Concours existants
        </h2>
        {loading ? (
          <div className="skeleton h-32 rounded-2xl" />
        ) : list.length === 0 ? (
          <div className="glass p-10 text-center text-sm text-white/60">Aucun concours.</div>
        ) : (
          <div className="space-y-2">
            {list.map((c) => (
              <div key={c.id} className="glass flex flex-col gap-3 p-4 text-sm md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {c.titre}
                    {c.actif ? (
                      <span className="rounded-full bg-[#5DCAA5]/20 px-2 py-0.5 text-[9px] text-[#5DCAA5]">ACTIF</span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/50">INACTIF</span>
                    )}
                  </p>
                  <p className="text-[11px] text-white/50">{c.type} • {c.participants_count} participants</p>
                  <p className="text-[10px] text-white/40">
                    {new Date(c.date_debut).toLocaleDateString('fr-FR')} → {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                  {c.description && <p className="mt-1 text-[11px] text-white/60">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(c)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] hover:bg-white/10"
                  >
                    {c.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
