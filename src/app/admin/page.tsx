'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Euro, TrendingUp, Building2, Trophy, Wallet } from 'lucide-react'

type Stats = {
  users_total: number
  users_autopilote: number
  users_pro: number
  users_payant: number
  demarches_total: number
  demarches_acceptees: number
  structures_total: number
  referrals_total: number
  mrr: number
  pending_payouts: number
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setStats(d as Stats))
      .catch(() => setError('Impossible de charger les stats'))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
        Admin — <span className="moksha-gradient-text">Vue globale</span>
      </h1>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card label="Utilisateurs" value={stats?.users_total ?? '...'} icon={<Users className="h-5 w-5" />} />
        <Card label="Clients payants" value={stats?.users_payant ?? '...'} icon={<TrendingUp className="h-5 w-5" />} />
        <Card label="MRR estimé" value={stats ? `${stats.mrr.toLocaleString('fr-FR')} €` : '...'} icon={<Euro className="h-5 w-5" />} accent />
        <Card label="Démarches" value={stats?.demarches_total ?? '...'} icon={<FileText className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card label="Autopilote" value={stats?.users_autopilote ?? '...'} icon={<TrendingUp className="h-5 w-5" />} />
        <Card label="Pro" value={stats?.users_pro ?? '...'} icon={<TrendingUp className="h-5 w-5" />} />
        <Card label="Structures" value={stats?.structures_total ?? '...'} icon={<Building2 className="h-5 w-5" />} />
        <Card label="Démarches acceptées" value={stats?.demarches_acceptees ?? '...'} icon={<FileText className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card label="Filleuls totaux" value={stats?.referrals_total ?? '...'} icon={<Trophy className="h-5 w-5" />} />
        <Card label="Retraits en attente" value={stats ? `${stats.pending_payouts.toLocaleString('fr-FR')} €` : '...'} icon={<Wallet className="h-5 w-5" />} />
      </div>
    </div>
  )
}

function Card({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="glass p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-gradient-to-br from-[#FF3D00] to-[#FFB300] text-[#070B18]' : 'bg-white/5 text-white/60'}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  )
}
