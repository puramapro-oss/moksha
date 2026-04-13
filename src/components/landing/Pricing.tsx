'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Flame } from 'lucide-react'

type Interval = 'mensuel' | 'annuel'

const plans = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    description: "Teste MOKSHA sans engagement.",
    prices: { mensuel: 0, annuel: 0 },
    cta: 'Commencer gratuitement',
    href: '/auth?next=/dashboard',
    featured: false,
    features: [
      'JurisIA — 3 questions / jour',
      'Modèles de documents',
      'Checklist création',
      'ProofVault 500 Mo',
      '1 structure',
    ],
  },
  {
    id: 'autopilote',
    name: 'Autopilote',
    description: 'Pour créer et piloter 100% en autonomie.',
    prices: { mensuel: 19, annuel: 15 },
    cta: 'Essai gratuit 14 jours',
    href: '/auth?next=/paiement?plan=autopilote',
    featured: true,
    badge: 'POPULAIRE',
    features: [
      'JurisIA illimité + sources',
      'Documents juridiques illimités',
      'Dépôt INPI automatique',
      'ProofVault illimité',
      'Rappels automatiques',
      'Score conformité temps réel',
      'Garantie Zéro Refus',
      'Express inclus',
      "Jusqu'à 3 structures",
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour cabinets, DAF, holdings.',
    prices: { mensuel: 49, annuel: 39 },
    cta: "S'abonner",
    href: '/auth?next=/paiement?plan=pro',
    featured: false,
    features: [
      'Tout Autopilote +',
      'Structures illimitées',
      'Délégation d\'accès',
      'Dossier banque en 1 clic',
      'Lien auditeur',
      'Export PDF / CSV',
      'API + webhooks',
      'Support 24/7',
    ],
  },
]

export default function Pricing() {
  const [interval, setInterval] = useState<Interval>('mensuel')

  return (
    <section id="pricing" className="moksha-section">
      <div className="moksha-container">
        {/* Bandeau financement */}
        <Link
          href="/auth?next=/dashboard/financer"
          className="mb-8 flex items-center justify-center gap-2 rounded-xl border border-[#5DCAA5]/30 bg-[#5DCAA5]/10 px-5 py-3 text-sm transition hover:bg-[#5DCAA5]/15"
        >
          <span className="text-lg">💰</span>
          <span className="text-[#5DCAA5]">
            La plupart de nos clients ne paient rien grâce aux aides publiques.
          </span>
          <span className="font-semibold text-[#5DCAA5] underline underline-offset-2">
            Vérifier mes aides →
          </span>
        </Link>

        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="moksha-eyebrow mb-3">Tarifs</p>
          <h2 className="moksha-h2">
            À ton <span className="moksha-gradient-text">rythme</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-white/55">
            Sans engagement, annulable en un clic. 10&nbsp;% du chiffre d&apos;affaires est reversé à l&apos;association Purama.
          </p>
          <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setInterval('mensuel')}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition sm:px-5 sm:py-2 sm:text-sm ${
                interval === 'mensuel' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/75'
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setInterval('annuel')}
              className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition sm:px-5 sm:py-2 sm:text-sm ${
                interval === 'annuel' ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18]' : 'text-white/50 hover:text-white/75'
              }`}
            >
              Annuel
              <span className="ml-1.5 rounded-full bg-[#5DCAA5]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#5DCAA5] sm:ml-2 sm:px-2">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl items-stretch gap-5 md:grid-cols-3 md:gap-4 lg:gap-5">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`glass relative flex flex-col p-7 sm:p-8 ${
                p.featured ? 'border-[#FF6B35]/35 shadow-[0_0_60px_-20px_rgba(255,107,53,0.55)] md:-my-3 md:py-10' : ''
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-3 py-1 text-[10px] font-bold tracking-wide text-[#070B18]">
                  {p.badge}
                </div>
              )}
              <div className="mb-5">
                <h3 className="font-display text-xl font-bold tracking-tight text-white">{p.name}</h3>
                <p className="mt-1 text-[13px] text-white/55">{p.description}</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[44px] font-extrabold leading-none tracking-tight text-white">
                    {p.prices[interval]}
                  </span>
                  <span className="text-2xl font-extrabold text-white">€</span>
                  {p.prices[interval] > 0 && <span className="ml-1 text-[13px] text-white/45">/mois</span>}
                </div>
                {interval === 'annuel' && p.prices.annuel > 0 && (
                  <p className="mt-1 text-[11px] text-white/40">facturé {p.prices.annuel * 12}€/an</p>
                )}
              </div>
              <ul className="mb-7 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5DCAA5]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-bold transition ${
                  p.featured
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18] shadow-[0_8px_30px_-12px_rgba(255,215,0,0.55)] hover:opacity-95'
                    : 'border border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]'
                }`}
              >
                {p.featured && <Flame className="h-4 w-4" />}
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
