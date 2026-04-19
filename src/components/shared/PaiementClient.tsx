'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

type Interval = 'mensuel' | 'annuel'

const PREMIUM_PRICES: Record<Interval, { monthly: number; yearly: number; label: string }> = {
  mensuel: { monthly: 29.99, yearly: 0, label: '29,99€/mois' },
  annuel: { monthly: 23.99, yearly: 287.9, label: '287,90€/an (soit 23,99€/mois, −20%)' },
}

const PREMIUM_FEATURES = [
  'Création d\'entreprise en 10 min (SASU/SAS/SARL/EURL/SCI/Micro)',
  'JurisIA illimité avec sources Legifrance / INPI',
  'Dépôt INPI automatique (Pappers Services)',
  'ProofVault illimité — AES-256 + timeline horodatée',
  'Score conformité temps réel + Garantie Zéro Refus',
  'Express inclus (24h au lieu de 72h)',
  'Structures illimitées + Dossier banque 1 clic',
  'Rappels AG/TVA/URSSAF auto + Simulateur fiscal',
]

export default function PaiementClient() {
  const params = useSearchParams()
  const legacyPlan = params.get('plan') // autopilote/pro = legacy grandfather
  const intervalParam = (params.get('interval') || 'mensuel') as Interval
  const [interval, setIntervalState] = useState<Interval>(
    intervalParam === 'annuel' ? 'annuel' : 'mensuel',
  )
  const { profile, isAuthenticated, loading } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  // Plan par défaut = premium. Si legacy explicite (?plan=autopilote|pro) → on le passe au backend.
  const plan = useMemo(() => {
    if (legacyPlan === 'autopilote' || legacyPlan === 'pro') return legacyPlan
    return 'premium'
  }, [legacyPlan])

  async function checkout() {
    if (!isAuthenticated) {
      window.location.href = `/auth?next=${encodeURIComponent(`/paiement?plan=${plan}&interval=${interval}`)}`
      return
    }
    setRedirecting(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Checkout impossible')
      }
      const data = (await res.json()) as { url?: string }
      if (data.url) window.location.href = data.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      setRedirecting(false)
    }
  }

  useEffect(() => {
    if (!loading && profile?.plan && profile.plan !== 'gratuit') {
      toast.info(`Tu es déjà sur le plan ${profile.plan}`)
    }
  }, [loading, profile?.plan])

  const pricing = PREMIUM_PRICES[interval]

  return (
    <section className="mx-auto max-w-xl px-6 pt-32 pb-20">
      <div className="glass p-10">
        <div className="text-center">
          <Flame className="mx-auto mb-4 h-10 w-10 text-[#FF6B35]" />
          <h1 className="font-display text-4xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
            MOKSHA <span className="moksha-gradient-text">Premium</span>
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Plan unique — tout inclus — sans engagement
          </p>
        </div>

        <div className="mt-6 inline-flex w-full items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setIntervalState('mensuel')}
            className={`flex-1 rounded-full px-4 py-2 text-[13px] font-medium transition ${
              interval === 'mensuel' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/75'
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setIntervalState('annuel')}
            className={`relative flex-1 rounded-full px-4 py-2 text-[13px] font-medium transition ${
              interval === 'annuel'
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18]'
                : 'text-white/50 hover:text-white/75'
            }`}
          >
            Annuel
            <span className="ml-2 rounded-full bg-[#5DCAA5]/20 px-2 py-0.5 text-[10px] font-bold text-[#5DCAA5]">
              −20%
            </span>
          </button>
        </div>

        <div className="my-8 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-5xl font-extrabold">{pricing.monthly.toFixed(2).replace('.', ',')}</span>
            <span className="text-2xl font-extrabold">€</span>
            <span className="ml-1 text-sm text-white/50">/mois</span>
          </div>
          {interval === 'annuel' && (
            <p className="mt-2 text-[11px] text-white/45">facturé {pricing.yearly.toFixed(2).replace('.', ',')}€/an</p>
          )}
        </div>

        <ul className="mb-7 space-y-2.5">
          {PREMIUM_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-white/75">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5DCAA5]" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <p className="mb-4 text-center text-sm text-white/80">
          Prime de bienvenue <strong>100€</strong> alignée sur tes paiements : <strong>25€ J1</strong> · 25€ à J30 · 50€ à J60.
          Versée en euros réels via Stripe Connect sur ton compte bancaire après KYC.
        </p>

        <button
          onClick={checkout}
          disabled={redirecting || loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FFD700] py-4 text-base font-bold text-[#070B18] disabled:opacity-50"
        >
          {redirecting ? 'Redirection...' : 'Démarrer & recevoir ma prime'}
        </button>
        <p className="mt-3 text-center text-[10px] text-white/40 leading-relaxed">
          En démarrant maintenant, tu bénéficies d&apos;un accès immédiat à ton abonnement (art. L221-28 Code conso) — ce qui entraîne renonciation à ton droit de rétractation de 14 jours. Paiement sécurisé Stripe.
          Prime alignée sur paiements d&apos;abonnement validés (J1 / J30 / J60).
          Annulation avant J60 = prime versée récupérée au prorata automatique.
        </p>

        {(legacyPlan === 'autopilote' || legacyPlan === 'pro') && (
          <p className="mt-4 text-center text-[11px] text-amber-400/70">
            Plan legacy <strong>{legacyPlan}</strong> sélectionné — conservé uniquement pour les abonnés existants.
            <a href="/paiement" className="ml-1 underline">Passer au Premium</a>
          </p>
        )}
      </div>
    </section>
  )
}
