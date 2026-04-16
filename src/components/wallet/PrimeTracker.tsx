'use client'

import { useEffect, useState } from 'react'
import { Gift, Check, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type Tranche = {
  label: string
  amount: number
  released: boolean
  eta: string
}

export default function PrimeTracker() {
  const { profile } = useAuth()
  const [tranches, setTranches] = useState<Tranche[]>([])
  const [loading, setLoading] = useState(true)
  const [subStartedAt, setSubStartedAt] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data: prof } = await supabase
        .from('moksha_profiles')
        .select('subscription_started_at, plan')
        .eq('id', profile.id)
        .single()
      const started = prof?.subscription_started_at ? new Date(prof.subscription_started_at) : null
      setSubStartedAt(started)

      const { data: txs } = await supabase
        .from('moksha_wallet_transactions')
        .select('amount, description, created_at')
        .eq('user_id', profile.id)
        .eq('type', 'prime')
        .order('created_at', { ascending: true })

      const tranche1 = (txs || []).find((t: { description?: string }) => (t.description || '').includes('J+0') || (t.description || '').toLowerCase().includes('bienvenue j+0'))
      const tranche2 = (txs || []).find((t: { description?: string }) => (t.description || '').includes('M+1'))
      const tranche3 = (txs || []).find((t: { description?: string }) => (t.description || '').includes('M+2'))

      const eta = (daysFromStart: number) => {
        if (!started) return '—'
        const d = new Date(started.getTime() + daysFromStart * 24 * 3600 * 1000)
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      }

      setTranches([
        { label: 'Tranche 1 — à la souscription', amount: 25, released: !!tranche1, eta: tranche1 ? 'Créditée' : eta(0) },
        { label: 'Tranche 2 — M+1', amount: 25, released: !!tranche2, eta: tranche2 ? 'Créditée' : eta(30) },
        { label: 'Tranche 3 — M+2', amount: 50, released: !!tranche3, eta: tranche3 ? 'Créditée' : eta(60) },
      ])
      setLoading(false)
    }
    load()
  }, [profile?.id, supabase])

  const totalReleased = tranches.filter((t) => t.released).reduce((s, t) => s + t.amount, 0)
  const totalMax = 100
  const progress = (totalReleased / totalMax) * 100
  const noSubYet = !subStartedAt

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="glass p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[#FFD700]" />
            <h3 className="font-semibold">Prime de bienvenue</h3>
          </div>
          <p className="mt-1 text-xs text-white/60">
            {noSubYet
              ? '100€ t\'attendent. Active ton abonnement pour commencer à les recevoir.'
              : `${totalReleased}€ crédités sur ${totalMax}€ — 3 tranches sur 90 jours.`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-extrabold text-[#FFD700]" style={{ fontFamily: 'var(--font-display)' }}>
            {totalReleased}€
          </p>
          <p className="text-[10px] text-white/40">/ {totalMax}€</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {tranches.map((t, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              {t.released ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5DCAA5]/20 text-[#5DCAA5]">
                  <Check className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40">
                  <Clock className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[11px] text-white/50">{t.eta}</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${t.released ? 'text-[#5DCAA5]' : 'text-white/70'}`}>+{t.amount}€</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-white/40">
        Prime versée en wallet Purama. Retrait possible après 30 jours d&apos;abonnement actif. Annulation &lt; 30 jours = prime déduite (art. L221-28 CGU).
      </p>
    </div>
  )
}
