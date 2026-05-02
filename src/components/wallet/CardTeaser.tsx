'use client'

import { useEffect, useState } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

export default function CardTeaser() {
  const { profile } = useAuth()
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: countData } = await supabase.rpc('moksha_card_waitlist_count')
      setWaitlistCount(typeof countData === 'number' ? countData : 0)
      if (profile?.id) {
        const { data } = await supabase
          .from('moksha_card_waitlist')
          .select('user_id')
          .eq('user_id', profile.id)
          .maybeSingle()
        setJoined(!!data)
      }
    }
    load()
  }, [profile?.id, supabase])

  const join = async () => {
    if (!profile?.id) return
    setLoading(true)
    const { error } = await supabase.from('moksha_card_waitlist').insert({ user_id: profile.id })
    setLoading(false)
    if (error) {
      toast.error('Impossible de te notifier pour le moment.')
      return
    }
    setJoined(true)
    setWaitlistCount((c) => (c ?? 0) + 1)
    toast.success('Tu seras notifié·e en premier 🔥')
  }

  return (
    <div className="glass relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#FFB300]/20 to-[#FF3D00]/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 grayscale opacity-70">
              <Sparkles className="h-6 w-6 text-white/30" />
            </div>
            <Lock className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#FFB300] p-1 text-[#070B18]" />
          </div>
          <div>
            <h3 className="font-semibold">Purama Card — Bientôt disponible</h3>
            <p className="mt-1 text-xs text-white/60">
              Carte virtuelle Apple Pay / Google Pay. Cashback 0-20% selon ton Nature Score. Retrait IBAN 10s.
            </p>
            {waitlistCount !== null && (
              <p className="mt-2 text-[11px] text-[#FFB300]">
                {waitlistCount.toLocaleString('fr-FR')} {waitlistCount === 1 ? 'personne attend' : 'personnes attendent'}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={join}
          disabled={joined || loading}
          className="rounded-xl bg-gradient-to-r from-[#FF3D00] to-[#FFB300] px-5 py-2.5 text-sm font-bold text-[#070B18] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {joined ? '✓ Tu seras notifié·e' : loading ? '…' : 'Me notifier en premier'}
        </button>
      </div>
    </div>
  )
}
