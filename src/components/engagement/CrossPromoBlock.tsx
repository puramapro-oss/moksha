'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ExternalLink, Scale } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// V7 §15 — mapping cross-promo
// MOKSHA → KASH (1er), JurisPurama (2e)
// KASH pas live (404) → on promeut JurisPurama
type PromoTarget = {
  slug: string
  name: string
  domain: string
  tagline: string
  description: string
  accent: string
  iconBg: string
}

const TARGETS: PromoTarget[] = [
  {
    slug: 'jurispurama',
    name: 'JurisPurama',
    domain: 'jurispurama.purama.dev',
    tagline: 'Ton avocat IA 24/7',
    description: 'Conseil juridique expert, contrats, CGV, RGPD — sans rendez-vous.',
    accent: '#6D28D9',
    iconBg: 'from-[#6D28D9] to-[#F59E0B]',
  },
]

const target = TARGETS[0]

export default function CrossPromoBlock() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    setClicked(false)
  }, [profile?.id])

  const href = `https://${target.domain}/go/moksha?coupon=WELCOME50`

  const handleClick = async () => {
    setClicked(true)
    // Tracking optimiste côté MOKSHA (clic sortant)
    if (profile?.id) {
      try {
        await supabase.from('moksha_cross_promos').insert({
          source_app: 'moksha',
          target_app: target.slug,
          user_id: profile.id,
          coupon_used: 'WELCOME50',
        })
      } catch {
        // Non bloquant
      }
    }
  }

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-6">
      {/* Orbe domaine juridique */}
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(circle, ${target.accent}, transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${target.iconBg}`}>
          <Scale className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-lg font-extrabold">Découvre {target.name}</h2>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{
                color: target.accent,
                backgroundColor: `${target.accent}20`,
                border: `1px solid ${target.accent}40`,
              }}
            >
              Purama
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/60">{target.tagline}</p>
        </div>
      </div>

      <p className="relative mt-3 text-sm text-white/75">{target.description}</p>

      <div className="relative mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-3">
        <Sparkles className="h-4 w-4 shrink-0 text-[#FFD700]" />
        <div className="flex-1 text-xs text-white/80">
          <strong className="text-[#FFD700]">-50% le premier mois</strong> + 100€ de prime de bienvenue.
          <span className="ml-1 text-white/50">Automatique, aucun code à saisir.</span>
        </div>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
        style={{ background: `linear-gradient(90deg, ${target.accent}, #F59E0B)` }}
      >
        {clicked ? 'Ouverture...' : `Essayer ${target.name}`}
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  )
}
