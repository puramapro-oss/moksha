'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type Tier = {
  name: string
  filleuls: number
  prime: number
  color: string
}

const TIERS: Tier[] = [
  { name: 'Bronze', filleuls: 10, prime: 200, color: '#CD7F32' },
  { name: 'Argent', filleuls: 25, prime: 500, color: '#C0C0C0' },
  { name: 'Or', filleuls: 50, prime: 1000, color: '#FFD700' },
  { name: 'Platine', filleuls: 100, prime: 2500, color: '#E5E4E2' },
  { name: 'Diamant', filleuls: 250, prime: 6000, color: '#B9F2FF' },
  { name: 'Légende', filleuls: 500, prime: 12000, color: '#FF6B35' },
  { name: 'Titan', filleuls: 1000, prime: 25000, color: '#7C3AED' },
  { name: 'Dieu', filleuls: 5000, prime: 100000, color: '#F472B6' },
  { name: 'Éternel', filleuls: 10000, prime: 200000, color: '#FFFFFF' },
]

function formatEuros(n: number): string {
  if (n >= 1000) return `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}K€`
  return `${n}€`
}

function currentTierIndex(active: number): number {
  // Dernier palier atteint (ou -1 si aucun)
  let idx = -1
  for (let i = 0; i < TIERS.length; i++) {
    if (active >= TIERS[i].filleuls) idx = i
  }
  return idx
}

export default function AmbassadorBlock() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    let alive = true
    const load = async () => {
      // Filleuls actifs = filleuls avec plan payant (non "gratuit")
      const { count } = await supabase
        .from('moksha_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', profile.id)
        .neq('plan', 'gratuit')
      if (!alive) return
      setActive(count ?? 0)
    }
    load()
    return () => {
      alive = false
    }
  }, [profile?.id, supabase])

  if (!profile?.id || active === null) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="skeleton h-36 rounded-xl" />
      </div>
    )
  }

  const tierIdx = currentTierIndex(active)
  const currentTier = tierIdx >= 0 ? TIERS[tierIdx] : null
  const nextTier = tierIdx + 1 < TIERS.length ? TIERS[tierIdx + 1] : null
  const prevThreshold = currentTier?.filleuls ?? 0
  const nextThreshold = nextTier?.filleuls ?? prevThreshold
  const progress = nextTier
    ? Math.min(100, Math.max(0, ((active - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
    : 100

  return (
    <div className="glass relative overflow-hidden rounded-2xl border-[#FFD700]/20 p-6">
      {/* Orbe dorée */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #FFD700, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FF6B35]">
          <Crown className="h-5 w-5 text-[#070B18]" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold">Deviens Ambassadeur Purama</h2>
          <p className="mt-0.5 text-xs text-white/60">
            {currentTier
              ? `Palier actuel : ${currentTier.name} · prime ${formatEuros(currentTier.prime)} débloquée`
              : 'Paliers Bronze 200€ → Éternel 200 000€'}
          </p>
        </div>
        {currentTier && (
          <span
            className="hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase md:inline"
            style={{ color: currentTier.color, border: `1px solid ${currentTier.color}40`, backgroundColor: `${currentTier.color}15` }}
          >
            {currentTier.name}
          </span>
        )}
      </div>

      {/* Paliers visuels (scroll horizontal sur mobile) */}
      <div className="relative mt-4 -mx-1 overflow-x-auto pb-2">
        <div className="flex min-w-full items-end gap-1.5 px-1">
          {TIERS.map((t, i) => {
            const reached = i <= tierIdx
            const isNext = i === tierIdx + 1
            return (
              <div
                key={t.name}
                className="flex flex-1 min-w-[62px] flex-col items-center gap-1"
                aria-current={isNext ? 'step' : undefined}
              >
                <div
                  className="h-8 w-8 rounded-lg border transition"
                  style={{
                    backgroundColor: reached ? t.color : 'rgba(255,255,255,0.05)',
                    borderColor: reached ? t.color : 'rgba(255,255,255,0.1)',
                    boxShadow: isNext ? `0 0 16px ${t.color}80` : 'none',
                  }}
                />
                <span className={`text-[10px] font-semibold ${reached ? 'text-white' : 'text-white/40'}`}>
                  {t.name}
                </span>
                <span className="text-[9px] text-white/40">{formatEuros(t.prime)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progression vers palier suivant */}
      {nextTier && (
        <div className="mt-3 space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-white/60">
              <strong className="text-white">{active}</strong> / {nextTier.filleuls} filleuls
              {' → '}
              <span style={{ color: nextTier.color }}>{nextTier.name}</span>
            </span>
            <span className="font-bold" style={{ color: nextTier.color }}>
              +{formatEuros(nextTier.prime - (currentTier?.prime ?? 0))}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${currentTier?.color || '#FF6B35'}, ${nextTier.color})`,
              }}
            />
          </div>
        </div>
      )}

      <Link
        href="/ambassadeur"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FF6B35] px-4 py-2.5 text-sm font-bold text-[#070B18] transition active:scale-[0.98]"
      >
        Postuler comme Ambassadeur
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
