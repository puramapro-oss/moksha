/**
 * MOKSHA V4 — Stripe Connect Express + Embedded Components
 * Source of truth: ~/purama/STRIPE_CONNECT_KARMA_V4.md
 *
 * Architecture:
 * - type: 'express' pour KYC simplifié + payouts SEPA instant
 * - controller.fees.payer = 'account' (user paye les frais 2,30€ par retrait)
 * - controller.losses.payments = 'application' (SASU couvre les chargebacks sur abonnements)
 * - controller.stripe_dashboard.type = 'none' (Embedded Components, jamais redirect)
 *
 * Licence: Stripe Technology Europe Limited (STEL) EMI passportée FR via PSD2.
 * Purama NE possède JAMAIS les fonds. Pas d'agrément PSAN requis.
 */

import type Stripe from 'stripe'
import { getStripe } from './stripe'

export interface ConnectAccountInput {
  userId: string
  email: string
  country?: string
}

export interface ConnectAccountStatus {
  stripeAccountId: string
  onboardingCompleted: boolean
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  requirements: Stripe.Account.Requirements | null
}

/**
 * Crée un compte Stripe Connect Express pour un user.
 * V4: controller.fees.payer='account', losses='application', dashboard='none'.
 */
export async function createConnectAccount(input: ConnectAccountInput): Promise<Stripe.Account> {
  const stripe = getStripe()
  return stripe.accounts.create({
    type: 'express',
    country: input.country ?? 'FR',
    email: input.email,
    capabilities: {
      transfers: { requested: true },
    },
    controller: {
      fees: { payer: 'account' },
      losses: { payments: 'application' },
      stripe_dashboard: { type: 'none' },
    },
    metadata: {
      user_id: input.userId,
      app: 'moksha',
      version: 'v4',
    },
  })
}

/**
 * Crée une AccountSession pour Embedded Components (KYC reste sur moksha.purama.dev).
 * TTL : ~1h (auto-régénéré côté client).
 *
 * V7.1/V4.1 §36.5 — 7 composants activés :
 *   account_onboarding, account_management, notification_banner,
 *   payouts, payments, balances, documents.
 *
 * Mappés sur les 7 site links Stripe Dashboard (purama.dev/compte/*).
 */
export async function createAccountSession(
  stripeAccountId: string,
): Promise<Stripe.AccountSession> {
  const stripe = getStripe()
  return stripe.accountSessions.create({
    account: stripeAccountId,
    components: {
      account_onboarding: {
        enabled: true,
        features: { external_account_collection: true },
      },
      account_management: {
        enabled: true,
        features: { external_account_collection: true },
      },
      notification_banner: {
        enabled: true,
        features: { external_account_collection: true },
      },
      payouts: {
        enabled: true,
        features: {
          standard_payouts: true,
          instant_payouts: true,
          external_account_collection: true,
          edit_payout_schedule: true,
        },
      },
      payments: {
        enabled: true,
        features: {
          refund_management: false,
          dispute_management: false,
          capture_payments: false,
          destination_on_behalf_of_charge_management: false,
        },
      },
      balances: {
        enabled: true,
        features: {
          standard_payouts: true,
          instant_payouts: true,
          external_account_collection: true,
          edit_payout_schedule: true,
        },
      },
      documents: { enabled: true },
    },
  })
}

/**
 * Récupère le statut actuel d'un compte Connect (poll KYC).
 */
export async function getConnectAccountStatus(stripeAccountId: string): Promise<ConnectAccountStatus> {
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(stripeAccountId)
  return {
    stripeAccountId: account.id,
    onboardingCompleted: account.details_submitted === true && account.payouts_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
    chargesEnabled: account.charges_enabled === true,
    detailsSubmitted: account.details_submitted === true,
    requirements: account.requirements ?? null,
  }
}

/**
 * Transfer SEPA depuis le balance SASU vers le compte Connect du user.
 * Utilisé par les CRONs primes, bourses, karma_winners.
 */
export async function transferToConnect(params: {
  stripeAccountId: string
  amountCents: number
  description: string
  metadata?: Record<string, string>
  idempotencyKey: string
}): Promise<Stripe.Transfer> {
  const stripe = getStripe()
  return stripe.transfers.create(
    {
      amount: params.amountCents,
      currency: 'eur',
      destination: params.stripeAccountId,
      description: params.description,
      metadata: params.metadata ?? {},
    },
    { idempotencyKey: params.idempotencyKey },
  )
}

/**
 * Grille frais V4:
 *   20€ → 2,30€ (11,5%) · 30€ → 2,33€ (7,8%) · 50€ → 2,38€ (4,8%) · 100€ → 2,50€ (2,5%)
 * Seuil min: 20€ · Recommandé: 50€
 */
export function estimateWithdrawalFees(amountEur: number): { fees: number; percent: number } {
  if (amountEur < 20) return { fees: 0, percent: 0 }
  // Approx Stripe SEPA instant: 0.25€ + 1% du montant, min 2,30€
  const fees = Math.max(2.3, 0.25 + amountEur * 0.01)
  return { fees: Math.round(fees * 100) / 100, percent: Math.round((fees / amountEur) * 10000) / 100 }
}

export const WITHDRAWAL_MIN_EUR = Number(process.env.KARMA_MIN_WITHDRAWAL_EUR ?? '20')
export const WITHDRAWAL_RECOMMENDED_EUR = Number(process.env.KARMA_RECOMMENDED_WITHDRAWAL_EUR ?? '50')
