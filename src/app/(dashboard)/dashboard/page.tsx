'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bot, FileText, Lock, Plus, TrendingUp, Users, Wallet as WalletIcon, Flame, Star, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import StreakBadge from '@/components/shared/StreakBadge'

type Stats = {
  demarches: number
  structures: number
  documents: number
  score: number
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const [d, s, doc, conf] = await Promise.all([
        supabase.from('moksha_demarches').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('moksha_structures').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('moksha_documents').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        fetch('/api/conformity/me').then((r) => (r.ok ? r.json() : { score: 0 })),
      ])
      setStats({
        demarches: d.count ?? 0,
        structures: s.count ?? 0,
        documents: doc.count ?? 0,
        score: conf?.score ?? 0,
      })
    }
    load()
  }, [profile?.id, supabase])

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
  })()

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
            {greeting}, {profile?.full_name?.split(' ')[0] || 'entrepreneur'} 🔥
          </h1>
          <StreakBadge />
        </div>
        <p className="mt-2 text-white/60">Voici où en est ton empire.</p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/creer/entreprise"
          className="glass glass-hover group flex items-center gap-4 p-5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FFD700]">
            <Plus className="h-5 w-5 text-[#070B18]" />
          </div>
          <div>
            <h3 className="font-semibold">Créer une entreprise</h3>
            <p className="text-xs text-white/50">SASU, SAS, SARL…</p>
          </div>
        </Link>
        <Link
          href="/dashboard/jurisia"
          className="glass glass-hover flex items-center gap-4 p-5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B35]/20 border border-[#FF6B35]/30">
            <Bot className="h-5 w-5 text-[#FF6B35]" />
          </div>
          <div>
            <h3 className="font-semibold">Demander à JurisIA</h3>
            <p className="text-xs text-white/50">Conseil juridique 24/7</p>
          </div>
        </Link>
        <Link
          href="/dashboard/proofvault"
          className="glass glass-hover flex items-center gap-4 p-5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5DCAA5]/20 border border-[#5DCAA5]/30">
            <Lock className="h-5 w-5 text-[#5DCAA5]" />
          </div>
          <div>
            <h3 className="font-semibold">Coffre-fort</h3>
            <p className="text-xs text-white/50">Tes documents sécurisés</p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Démarches" value={stats?.demarches ?? '...'} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Structures" value={stats?.structures ?? '...'} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Documents" value={stats?.documents ?? '...'} icon={<Lock className="h-5 w-5" />} />
        <StatCard label="Score conformité" value={stats ? `${stats.score}%` : '...'} icon={<Flame className="h-5 w-5" />} accent />
      </div>

      {/* Tiles */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/parrainage" className="glass glass-hover flex items-center gap-4 p-6">
          <Users className="h-8 w-8 text-[#FFD700]" />
          <div>
            <h3 className="font-semibold">Parrainage</h3>
            <p className="text-xs text-white/50">Ton code : {profile?.referral_code || '—'}</p>
          </div>
        </Link>
        <Link href="/dashboard/wallet" className="glass glass-hover flex items-center gap-4 p-6">
          <WalletIcon className="h-8 w-8 text-[#5DCAA5]" />
          <div>
            <h3 className="font-semibold">Wallet</h3>
            <p className="text-xs text-white/50">Tes gains et retraits</p>
          </div>
        </Link>
        <Link href="/dashboard/points" className="glass glass-hover flex items-center gap-4 p-6">
          <Star className="h-8 w-8 text-[#FFD700]" />
          <div>
            <h3 className="font-semibold">Points Purama</h3>
            <p className="text-xs text-white/50">Coffre quotidien + boutique</p>
          </div>
        </Link>
        <Link href="/dashboard/concours" className="glass glass-hover flex items-center gap-4 p-6">
          <Trophy className="h-8 w-8 text-[#FF6B35]" />
          <div>
            <h3 className="font-semibold">Concours</h3>
            <p className="text-xs text-white/50">Classement hebdo + tirage mensuel</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: boolean
}) {
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
