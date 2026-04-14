'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, Star, Heart, Wind, Banknote, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { getLigue } from '@/lib/ligues'

type WrappedStats = {
  month: string
  points: number
  gratitudes: number
  breath_min: number
  dossiers: number
  intentions: number
  intentions_done: number
  streak: number
}

export default function WrappedPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [stats, setStats] = useState<WrappedStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile?.id) return

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const start = firstOfMonth.toISOString()
    const monthName = firstOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    const [pts, grat, breath, dossiers, intentions, gift] = await Promise.all([
      supabase
        .from('moksha_point_transactions')
        .select('amount')
        .eq('user_id', profile.id)
        .gte('created_at', start),
      supabase
        .from('moksha_gratitude_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('created_at', start),
      supabase
        .from('moksha_breath_sessions')
        .select('duration_seconds')
        .eq('user_id', profile.id)
        .gte('created_at', start),
      supabase
        .from('moksha_dossiers_financement')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('created_at', start),
      supabase
        .from('moksha_intentions')
        .select('completed')
        .eq('user_id', profile.id)
        .gte('created_at', start),
      supabase
        .from('moksha_daily_gifts')
        .select('streak_count')
        .eq('user_id', profile.id)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const points = (pts.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
    const breath_min = Math.round(
      ((breath.data ?? []).reduce((s, b) => s + (b.duration_seconds ?? 0), 0)) / 60,
    )
    const intentionRows = intentions.data ?? []
    const intentionsDone = intentionRows.filter((i) => i.completed).length

    setStats({
      month: monthName,
      points,
      gratitudes: grat.count ?? 0,
      breath_min,
      dossiers: dossiers.count ?? 0,
      intentions: intentionRows.length,
      intentions_done: intentionsDone,
      streak: gift.data?.streak_count ?? 0,
    })
    setLoading(false)
  }, [profile?.id, supabase])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="skeleton h-96 rounded-2xl" />
  if (!stats) return <p className="text-center text-sm text-white/50">Pas encore de données ce mois-ci.</p>

  const ligue = getLigue(stats.points)

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="flex items-center gap-3 font-[family-name:var(--font-display)] text-3xl font-extrabold capitalize"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Calendar className="h-6 w-6 text-[#FFD700]" />
          Wrapped {stats.month}
        </h1>
        <p className="mt-1 text-sm text-white/60">Ton mois en chiffres. Tu vois ? Tu es capable de tout.</p>
      </div>

      {/* Big number — points */}
      <div className="glass relative overflow-hidden rounded-2xl p-8 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/10 to-[#FFD700]/5" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-white/50">Points gagnés ce mois</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-6xl font-extrabold text-[#FFD700]">
            {stats.points.toLocaleString('fr-FR')}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs">
            <span className="text-base">{ligue.emoji}</span>
            <span className="font-semibold" style={{ color: ligue.color }}>
              Ligue {ligue.name}
            </span>
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5 text-center">
          <Heart className="mx-auto mb-2 h-6 w-6 text-[#FF6B35]" />
          <p className="text-3xl font-extrabold">{stats.gratitudes}</p>
          <p className="text-xs text-white/50">Gratitudes écrites</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <Wind className="mx-auto mb-2 h-6 w-6 text-[#5DCAA5]" />
          <p className="text-3xl font-extrabold">{stats.breath_min}</p>
          <p className="text-xs text-white/50">Minutes de respiration</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-[#FFD700]" />
          <p className="text-3xl font-extrabold">
            {stats.intentions_done}
            <span className="text-lg text-white/40">/{stats.intentions}</span>
          </p>
          <p className="text-xs text-white/50">Intentions accomplies</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <Banknote className="mx-auto mb-2 h-6 w-6 text-[#5DCAA5]" />
          <p className="text-3xl font-extrabold">{stats.dossiers}</p>
          <p className="text-xs text-white/50">Dossiers financement</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-[#FF6B35]" />
          <p className="text-3xl font-extrabold">{stats.streak}</p>
          <p className="text-xs text-white/50">Jours de streak</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-[#FFD700]">Valeur</p>
          <p className="mt-1 text-3xl font-extrabold text-[#FFD700]">
            {(stats.points * 0.01).toFixed(2)} €
          </p>
          <p className="text-xs text-white/50">Équivalent en boutique</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-sm italic text-white/70">
          &laquo; Chaque pas que tu fais te rapproche de ta vision. &raquo;
        </p>
      </div>
    </div>
  )
}
