'use client'

import { useEffect, useState } from 'react'
import { Bell, Plus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import type { Rappel } from '@/types'

export default function Rappels() {
  const { profile } = useAuth()
  const [rappels, setRappels] = useState<Rappel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTitre, setNewTitre] = useState('')
  const [newDate, setNewDate] = useState('')
  const supabase = createClient()

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('moksha_rappels')
      .select('*')
      .eq('user_id', profile.id)
      .order('date_echeance', { ascending: true })
    setRappels((data as Rappel[]) || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function add() {
    if (!newTitre || !newDate || !profile?.id) return
    const { error } = await supabase.from('moksha_rappels').insert({
      user_id: profile.id,
      type: 'echance_custom',
      titre: newTitre,
      date_echeance: newDate,
    })
    if (error) toast.error(error.message)
    else {
      toast.success('Rappel ajouté')
      setNewTitre('')
      setNewDate('')
      setShowForm(false)
      await load()
    }
  }

  async function complete(id: string) {
    await supabase.from('moksha_rappels').update({ statut: 'complete' }).eq('id', id)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
            <Bell className="h-6 w-6 text-[#FFB300]" /> Rappels
          </h1>
          <p className="mt-1 text-sm text-white/60">Échéances fiscales, sociales et juridiques.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-2.5 text-sm font-bold text-[#070B18]"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="glass p-5 space-y-3">
          <input
            placeholder="Titre du rappel"
            value={newTitre}
            onChange={(e) => setNewTitre(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF3D00]/60"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF3D00]/60"
          />
          <button
            onClick={add}
            className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-2.5 text-sm font-bold text-[#070B18]"
          >
            Ajouter
          </button>
        </div>
      )}

      {loading ? (
        <div className="skeleton h-32 rounded-2xl" />
      ) : rappels.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 py-14 text-center">
          <Bell className="h-10 w-10 text-white/30" />
          <p className="text-white/60">Aucun rappel pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rappels.map((r) => (
            <div key={r.id} className="glass flex items-center justify-between p-5">
              <div>
                <h3 className={`font-medium ${r.statut === 'complete' ? 'text-white/40 line-through' : ''}`}>{r.titre}</h3>
                <p className="text-xs text-white/50">{new Date(r.date_echeance).toLocaleDateString('fr-FR')}</p>
              </div>
              {r.statut !== 'complete' && (
                <button
                  onClick={() => complete(r.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#5DCAA5]/30 bg-[#5DCAA5]/10 px-3 py-1.5 text-xs text-[#5DCAA5] transition hover:bg-[#5DCAA5]/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Fait
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
