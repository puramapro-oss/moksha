'use client'

import { useEffect, useState } from 'react'
import { Users, Copy, Check, Share2, Gift } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

const REFERRAL_REWARD_EUR = 5

export default function ReferralBlock() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [filleuls, setFilleuls] = useState<number | null>(null)
  const [gains, setGains] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const link = profile?.referral_code
    ? `https://moksha.purama.dev/auth?ref=${profile.referral_code}`
    : ''

  useEffect(() => {
    if (!profile?.id) return
    let alive = true
    const load = async () => {
      const [{ count }, { data: txs }] = await Promise.all([
        supabase
          .from('moksha_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', profile.id),
        supabase
          .from('moksha_wallet_transactions')
          .select('amount')
          .eq('user_id', profile.id)
          .eq('type', 'commission'),
      ])
      if (!alive) return
      setFilleuls(count ?? 0)
      setGains((txs || []).reduce((sum, t) => sum + Number(t.amount || 0), 0))
    }
    load()
    return () => {
      alive = false
    }
  }, [profile?.id, supabase])

  const handleCopy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié ✨')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!link) return
    const shareData = {
      title: 'MOKSHA — Crée ton entreprise en 24h',
      text: 'Rejoins MOKSHA avec mon lien — on gagne tous les deux.',
      url: link,
    }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled — no toast
      }
    } else {
      handleCopy()
    }
  }

  if (!profile?.id) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="skeleton h-32 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-6">
      {/* Orbe décorative */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #FF3D00, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3D00] to-[#FFB300]">
          <Users className="h-5 w-5 text-[#070B18]" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold">Invite tes amis, gagne {REFERRAL_REWARD_EUR}€ par filleul</h2>
          <p className="mt-0.5 text-xs text-white/60">
            {filleuls === null
              ? '...'
              : filleuls === 0
                ? `Ton premier filleul te rapporte ${REFERRAL_REWARD_EUR}€ dès son inscription.`
                : `${filleuls} filleul${filleuls > 1 ? 's' : ''} — ${gains.toFixed(2)}€ cumulés`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <code className="flex-1 truncate text-xs text-white/70" title={link}>
          {link || 'Chargement...'}
        </code>
        <button
          onClick={handleCopy}
          disabled={!link}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 disabled:opacity-50"
          aria-label="Copier le lien de parrainage"
        >
          {copied ? <Check className="h-4 w-4 text-[#5DCAA5]" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleShare}
          disabled={!link}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-4 py-2 text-sm font-bold text-[#070B18] transition active:scale-[0.98] disabled:opacity-50"
        >
          <Share2 className="h-4 w-4" />
          Partager mon lien
        </button>
        <button
          onClick={() => setShowQR((v) => !v)}
          disabled={!link}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
        >
          <Gift className="h-4 w-4" />
          {showQR ? 'Masquer le QR' : 'QR code'}
        </button>
      </div>

      {showQR && link && (
        <div className="mt-4 flex justify-center rounded-xl border border-white/10 bg-white p-4">
          <QRCodeSVG value={link} size={160} bgColor="#ffffff" fgColor="#070B18" level="M" />
        </div>
      )}
    </div>
  )
}
