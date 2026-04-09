'use client'

import { useState, useEffect } from 'react'
import { Users, Copy, Check, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { REFERRAL_MILESTONES } from '@/lib/constants'
import ShareButtons from '@/components/shared/ShareButtons'

export default function Parrainage() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [filleuls, setFilleuls] = useState(0)
  const [gains, setGains] = useState(0)
  const supabase = createClient()

  const link = `https://moksha.purama.dev/auth?ref=${profile?.referral_code || ''}`

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { count } = await supabase
        .from('moksha_referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', profile.id)
      setFilleuls(count ?? 0)
      const { data } = await supabase
        .from('moksha_wallet_transactions')
        .select('amount')
        .eq('user_id', profile.id)
        .eq('type', 'commission')
      setGains((data || []).reduce((sum, t) => sum + Number(t.amount), 0))
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
        <p className="mt-1 text-sm text-white/60">Invite tes amis, gagne 50% du premier paiement + 10% récurrent à vie.</p>
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
          <p className="text-xs uppercase tracking-wider text-white/50">Filleuls</p>
          <p className="mt-2 text-4xl font-extrabold">{filleuls}</p>
        </div>
        <div className="glass p-6">
          <p className="text-xs uppercase tracking-wider text-white/50">Gains cumulés</p>
          <p className="mt-2 text-4xl font-extrabold text-[#FFD700]">{gains.toFixed(2)} €</p>
        </div>
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
