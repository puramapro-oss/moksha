'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Euro, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function AdminHome() {
  const [stats, setStats] = useState<{ users: number; demarches: number; revenue: number; payant: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [u, d, p] = await Promise.all([
        supabase.from('moksha_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('moksha_demarches').select('id', { count: 'exact', head: true }),
        supabase.from('moksha_profiles').select('id', { count: 'exact', head: true }).neq('plan', 'gratuit'),
      ])
      setStats({
        users: u.count ?? 0,
        demarches: d.count ?? 0,
        payant: p.count ?? 0,
        revenue: (p.count ?? 0) * 19,
      })
    }
    load()
  }, [supabase])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        Admin — <span className="moksha-gradient-text">Vue globale</span>
      </h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card label="Utilisateurs" value={stats?.users ?? '...'} icon={<Users className="h-5 w-5" />} />
        <Card label="Démarches" value={stats?.demarches ?? '...'} icon={<FileText className="h-5 w-5" />} />
        <Card label="Clients payants" value={stats?.payant ?? '...'} icon={<TrendingUp className="h-5 w-5" />} />
        <Card label="MRR estimé" value={`${stats?.revenue ?? '...'} €`} icon={<Euro className="h-5 w-5" />} accent />
      </div>
    </div>
  )
}

function Card({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="glass p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-gradient-to-br from-[#FF6B35] to-[#FFD700] text-[#070B18]' : 'bg-white/5 text-white/60'}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  )
}
