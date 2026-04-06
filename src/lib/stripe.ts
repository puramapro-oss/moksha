import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
  appInfo: { name: 'MOKSHA', version: '1.0.0' },
})

export const STRIPE_PLANS = {
  autopilote_mensuel: {
    name: 'MOKSHA Autopilote — Mensuel',
    description: 'JurisIA illimité, docs illimités, dépôt INPI automatique, ProofVault illimité, Express inclus.',
    unit_amount: 1900, // 19€
    interval: 'month' as const,
    plan: 'autopilote' as const,
  },
  autopilote_annuel: {
    name: 'MOKSHA Autopilote — Annuel',
    description: '15€/mois facturé annuellement. Économie -20%.',
    unit_amount: 18000, // 180€/an soit 15€/mois
    interval: 'year' as const,
    plan: 'autopilote' as const,
  },
  pro_mensuel: {
    name: 'MOKSHA Pro — Mensuel',
    description: 'Structures illimitées, délégation accès, API, support 24/7.',
    unit_amount: 4900, // 49€
    interval: 'month' as const,
    plan: 'pro' as const,
  },
  pro_annuel: {
    name: 'MOKSHA Pro — Annuel',
    description: '39€/mois facturé annuellement. Économie -20%.',
    unit_amount: 46800, // 468€
    interval: 'year' as const,
    plan: 'pro' as const,
  },
} as const

export type StripePlanKey = keyof typeof STRIPE_PLANS
