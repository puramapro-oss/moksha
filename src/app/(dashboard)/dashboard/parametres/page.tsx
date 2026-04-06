'use client'

import { useState, useEffect } from 'react'
import { Settings, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

export default function Parametres() {
  const { profile, signOut, refetch } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setFullName(profile?.full_name || '')
  }, [profile?.full_name])

  async function save() {
    if (!profile?.id) return
    setSaving(true)
    const { error } = await supabase
      .from('moksha_profiles')
      .update({ full_name: fullName })
      .eq('id', profile.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Profil mis à jour')
      await refetch()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <Settings className="h-6 w-6 text-[#FFD700]" /> Paramètres
        </h1>
      </div>

      <div className="glass p-6 space-y-5">
        <h2 className="font-semibold">Mon profil</h2>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Nom complet</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#FF6B35]/60"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Email</label>
          <input
            value={profile?.email || ''}
            disabled
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Plan actuel</label>
          <p className="rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 px-4 py-3 text-sm font-semibold text-[#FFD700] capitalize">
            {profile?.plan || 'gratuit'}
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-5 py-2.5 text-sm font-bold text-[#070B18] disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="glass p-6">
        <h2 className="mb-3 font-semibold text-red-300">Zone sensible</h2>
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </div>
  )
}
