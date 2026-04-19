import Stripe from 'stripe'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing', {
      apiVersion: '2025-09-30.clover',
      typescript: true,
      appInfo: { name: 'MOKSHA', version: '1.0.0' },
    })
  }
  return _stripe
}
/** @deprecated use getStripe() */
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    // @ts-expect-error dynamic access
    return getStripe()[prop]
  },
})

// V4 STRIPE_CONNECT_KARMA — Plan unique Premium 29,99€ + coupon ANNUAL_20 (-20%)
// Legacy plans (autopilote/pro) préservés pour grandfather : users existants gardent leur abo,
// mais les nouveaux paiements passent par `premium_*`.
export const STRIPE_PLANS = {
  premium_mensuel: {
    name: 'MOKSHA Premium — Mensuel',
    description: 'Création d\'entreprise 10 min, JurisIA illimité, dépôt INPI auto, ProofVault illimité, Express inclus, Garantie Zéro Refus, structures illimitées.',
    unit_amount: 2999, // 29,99€
    interval: 'month' as const,
    plan: 'premium' as const,
  },
  premium_annuel: {
    name: 'MOKSHA Premium — Annuel',
    description: '23,99€/mois facturé annuellement. Économie -20% (287,90€/an).',
    unit_amount: 28790, // 287,90€/an = 23,99€/m équivalent
    interval: 'year' as const,
    plan: 'premium' as const,
  },
  // Legacy — conservés pour grandfather (anciens abonnés). Nouveaux paiements → premium.
  autopilote_mensuel: {
    name: 'MOKSHA Autopilote — Mensuel (legacy)',
    description: 'Plan legacy — conservé pour abonnés existants.',
    unit_amount: 1900,
    interval: 'month' as const,
    plan: 'autopilote' as const,
  },
  autopilote_annuel: {
    name: 'MOKSHA Autopilote — Annuel (legacy)',
    description: 'Plan legacy — conservé pour abonnés existants.',
    unit_amount: 18000,
    interval: 'year' as const,
    plan: 'autopilote' as const,
  },
  pro_mensuel: {
    name: 'MOKSHA Pro — Mensuel (legacy)',
    description: 'Plan legacy — conservé pour abonnés existants.',
    unit_amount: 4900,
    interval: 'month' as const,
    plan: 'pro' as const,
  },
  pro_annuel: {
    name: 'MOKSHA Pro — Annuel (legacy)',
    description: 'Plan legacy — conservé pour abonnés existants.',
    unit_amount: 46800,
    interval: 'year' as const,
    plan: 'pro' as const,
  },
} as const

export type StripePlanKey = keyof typeof STRIPE_PLANS
export const ACTIVE_STRIPE_PLAN_KEYS = ['premium_mensuel', 'premium_annuel'] as const
export type ActiveStripePlanKey = (typeof ACTIVE_STRIPE_PLAN_KEYS)[number]
