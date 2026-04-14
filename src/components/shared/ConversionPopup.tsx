'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

const STORAGE_KEY = 'moksha-conversion-popup'
const MIN_DAYS_BETWEEN = 7
const MIN_VISITS = 3

type Trigger = {
  type: string
  title: string
  subtitle: string
  cta: string
  href: string
}

export default function ConversionPopup() {
  const { profile } = useAuth()
  const pathname = usePathname()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [trigger, setTrigger] = useState<Trigger | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    if (!pathname?.startsWith('/dashboard')) return
    if (pathname === '/dashboard/wrapped' || pathname === '/pricing') return
    if (profile.plan && profile.plan !== 'gratuit') return

    // Increment visit counter for this session
    const sessionKey = `${STORAGE_KEY}-session`
    const visits = Number(sessionStorage.getItem(sessionKey) ?? '0') + 1
    sessionStorage.setItem(sessionKey, String(visits))

    // Only trigger starting at 3rd visit of session
    if (visits < MIN_VISITS) return

    // Already shown this session?
    if (sessionStorage.getItem(`${STORAGE_KEY}-shown`) === '1') return

    // Server-side cooldown check
    ;(async () => {
      const since = new Date(Date.now() - MIN_DAYS_BETWEEN * 86400000).toISOString()
      const { data: recent } = await supabase
        .from('moksha_popups_shown')
        .select('id')
        .eq('user_id', profile.id)
        .gte('shown_at', since)
        .limit(1)

      if (recent && recent.length > 0) return

      // Pick trigger — points threshold OR default upgrade
      const { data: balance } = await supabase
        .from('moksha_point_balances')
        .select('balance')
        .eq('user_id', profile.id)
        .maybeSingle()

      const pts = balance?.balance ?? 0
      const euros = pts * 0.01

      let t: Trigger
      if (euros >= 5) {
        t = {
          type: 'gains_pending',
          title: `💰 ${euros.toFixed(2)}€ en attente`,
          subtitle: `Tu as accumulé ${pts} points. Passe Pro pour convertir en cash réel et retirer dès 5€.`,
          cta: 'Débloquer mes gains',
          href: '/pricing',
        }
      } else {
        t = {
          type: 'upgrade_default',
          title: 'Passe à l\'étape suivante',
          subtitle: 'Débloque JurisIA illimité, ProofVault infini, et +10% sur tous tes gains points.',
          cta: 'Voir les plans',
          href: '/pricing',
        }
      }

      setTrigger(t)

      // Record shown
      await supabase.from('moksha_popups_shown').insert({
        user_id: profile.id,
        trigger_type: t.type,
        action: 'shown',
      })

      sessionStorage.setItem(`${STORAGE_KEY}-shown`, '1')
      setTimeout(() => setOpen(true), 500)
    })()
  }, [profile, pathname, supabase])

  if (!open || !trigger) return null

  async function dismiss() {
    if (!profile?.id) return setOpen(false)
    await supabase.from('moksha_popups_shown').insert({
      user_id: profile.id,
      trigger_type: trigger!.type,
      action: 'dismissed',
    })
    setOpen(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9998] w-[calc(100%-2rem)] max-w-sm animate-fade-in md:bottom-6 md:right-6">
      <div className="glass relative overflow-hidden rounded-2xl border border-[#FFD700]/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="absolute right-3 top-3 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FFD700] shadow-[0_0_24px_rgba(255,215,0,0.3)]">
            <Sparkles className="h-5 w-5 text-[#070B18]" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-bold">
              {trigger.title}
            </h3>
            <p className="mt-1 text-xs text-white/70">{trigger.subtitle}</p>
          </div>
        </div>

        <Link
          href={trigger.href}
          onClick={() => setOpen(false)}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-4 py-2.5 text-xs font-bold text-[#070B18] transition active:scale-[0.98]"
        >
          {trigger.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
