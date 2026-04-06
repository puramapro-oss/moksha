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
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            Libère-toi à <span className="moksha-gradient-text">ton rythme</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            10 % du chiffre d&apos;affaires de MOKSHA est reversé à l&apos;association Purama (inclusion numérique).
          </p>
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
            <button
              onClick={() => setInterval('mensuel')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                interval === 'mensuel' ? 'bg-white/10 text-white' : 'text-white/50'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setInterval('annuel')}
              className={`relative rounded-full px-5 py-2 text-sm font-medium transition ${
                interval === 'annuel' ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18]' : 'text-white/50'
              }`}
            >
              Annuel
              <span className="ml-2 rounded-full bg-[#5DCAA5]/20 px-2 py-0.5 text-[10px] font-bold text-[#5DCAA5]">
                -20 %
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`glass relative flex flex-col p-8 ${
                p.featured ? 'scale-[1.03] border-[#FF6B35]/40 shadow-[0_0_60px_-15px_rgba(255,107,53,0.5)]' : ''
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD700] px-4 py-1 text-[11px] font-bold text-[#070B18]">
                  🔥 {p.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {p.name}
                </h3>
                <p className="mt-1 text-sm text-white/55">{p.description}</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold">
                    {p.prices[interval]}
                    <span className="text-2xl">€</span>
                  </span>
                  {p.prices[interval] > 0 && <span className="text-sm text-white/50">/mois</span>}
                </div>
                {interval === 'annuel' && p.prices.annuel > 0 && (
                  <p className="mt-1 text-xs text-white/40">facturé {p.prices.annuel * 12}€/an</p>
                )}
              </div>
              <ul className="mb-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5DCAA5]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                  p.featured
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD700] text-[#070B18] hover:opacity-95'
                    : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
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
