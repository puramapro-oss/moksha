'use client'

import { useState, useEffect } from 'react'
import { Users, Copy, Check, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { REFERRAL_MILESTONES } from '@/lib/constants'
import ShareButtons from '@/components/shared/ShareButtons'

type LevelStats = { count: number; gains: number }

export default function Parrainage() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [filleuls, setFilleuls] = useState(0)
  const [gains, setGains] = useState(0)
  const [levels, setLevels] = useState<{ 1: LevelStats; 2: LevelStats; 3: LevelStats }>({
    1: { count: 0, gains: 0 },
    2: { count: 0, gains: 0 },
    3: { count: 0, gains: 0 },
  })
  const supabase = createClient()

  const link = `https://moksha.purama.dev/auth?ref=${profile?.referral_code || ''}`

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      // Compte filleuls N1 direct via profiles.referred_by
      const { count: n1Count } = await supabase
        .from('moksha_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', profile.id)
      setFilleuls(n1Count ?? 0)

      // Transactions commissions par niveau (parse depuis description "Commission N1 — ...")
      const { data: txs } = await supabase
        .from('moksha_wallet_transactions')
        .select('amount, description')
        .eq('user_id', profile.id)
        .eq('type', 'commission')
      const byLevel: { 1: LevelStats; 2: LevelStats; 3: LevelStats } = {
        1: { count: 0, gains: 0 },
        2: { count: 0, gains: 0 },
        3: { count: 0, gains: 0 },
      }
      let total = 0
      for (const t of txs || []) {
        const amt = Number(t.amount)
        total += amt
        const m = (t.description || '').match(/Commission N([123])/)
        const lvl = m ? (parseInt(m[1], 10) as 1 | 2 | 3) : 1
        byLevel[lvl].count += 1
        byLevel[lvl].gains += amt
      }

      // Compter filleuls N2/N3 via moksha_referrals
      const { data: refs } = await supabase
        .from('moksha_referrals')
        .select('referee_id, level')
        .eq('referrer_id', profile.id)
      const seen = { 1: new Set<string>(), 2: new Set<string>(), 3: new Set<string>() }
      for (const r of refs || []) {
        const lvl = (r.level as 1 | 2 | 3) ?? 1
        seen[lvl].add(r.referee_id)
      }
      byLevel[2].count = seen[2].size
      byLevel[3].count = seen[3].size

      setGains(total)
      setLevels(byLevel)
    }
    load()
  }, [profile?.id, supabase])

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <Users className="h-6 w-6 text-[#FFD700]" /> Parrainage
        </h1>
        <p className="mt-1 text-sm text-white/60">Parrainage 3 niveaux à vie : N1 = 50% · N2 = 15% · N3 = 7%. Versement auto à chaque facturation filleul.</p>
      </div>

      <div className="glass p-6">
        <p className="mb-2 text-xs uppercase tracking-wider text-white/50">Ton code</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-xl border border-[#FF6B35]/30 bg-[#FF6B35]/5 px-4 py-3 font-mono text-lg font-bold text-[#FFD700]">
            {profile?.referral_code || '—'}
          </code>
          <button
            onClick={copy}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-4 py-3 text-sm font-bold text-[#070B18]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <p className="mt-3 truncate text-xs text-white/50">{link}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass p-6">
          <p className="text-xs uppercase tracking-wider text-white/50">Filleuls directs (N1)</p>
          <p className="mt-2 text-4xl font-extrabold">{filleuls}</p>
        </div>
        <div className="glass p-6">
          <p className="text-xs uppercase tracking-wider text-white/50">Gains cumulés</p>
          <p className="mt-2 text-4xl font-extrabold text-[#FFD700]">{gains.toFixed(2)} €</p>
        </div>
      </div>

      {/* Arbre 3 niveaux */}
      <div className="glass p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Users className="h-4 w-4 text-[#FFD700]" /> Ta descendance
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {([1, 2, 3] as const).map((lvl) => {
            const meta = {
              1: { label: 'N1 — Direct', rate: '50%', accent: '#FFD700' },
              2: { label: 'N2 — Indirect', rate: '15%', accent: '#FF6B35' },
              3: { label: 'N3 — Profond', rate: '7%', accent: '#5DCAA5' },
            }[lvl]
            const s = levels[lvl]
            return (
              <div
                key={lvl}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50">{meta.label}</p>
                  <p className="mt-1 text-2xl font-extrabold">{s.count}</p>
                  <p className="text-[11px] text-white/50">{meta.rate} de chaque paiement</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: meta.accent }}>
                    +{s.gains.toFixed(2)}€
                  </p>
                  <p className="text-[10px] text-white/40">cumulés</p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] text-white/40">
          Anti-fraude : commission versée après 30 jours d&apos;activité réelle du filleul.
        </p>
      </div>

      {/* Share buttons */}
      <div className="glass p-6">
        <h2 className="mb-3 font-semibold">Partager MOKSHA</h2>
        <ShareButtons referralCode={profile?.referral_code || ''} />
      </div>

      <div className="glass p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Gift className="h-4 w-4 text-[#FF6B35]" /> Paliers
        </h2>
        <div className="space-y-3">
          {REFERRAL_MILESTONES.map((m) => {
            const reached = filleuls >= m.filleuls
            return (
              <div
                key={m.filleuls}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  reached ? 'border-[#5DCAA5]/40 bg-[#5DCAA5]/5' : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <div>
                  <p className={`font-semibold ${reached ? 'text-[#5DCAA5]' : ''}`}>{m.label}</p>
                  <p className="text-xs text-white/50">{m.filleuls} filleuls</p>
                </div>
                <p className="text-lg font-bold text-[#FFD700]">+{m.bonus} €</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
