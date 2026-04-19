/**
 * MOKSHA V4 — Primes alignées abonnement (Phase 1 : J1/J30/J60 = 25/25/50€)
 * Source of truth: ~/purama/STRIPE_CONNECT_KARMA_V4.md §PRIMES
 *
 * Règle d'alignement critique: le user touche sa prime SEULEMENT APRÈS
 * que l'abonnement du mois correspondant est payé. Si prélèvement échoue,
 * le palier est suspendu ce mois-là et réactivé au prochain succès.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { transferToConnect } from './stripe-connect'

// Typage souple: accepte SupabaseClient quel que soit le schema (moksha vs public)
// car le client admin est créé avec { db: { schema: 'moksha' } }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>

export type PrimePalier = 1 | 2 | 3
export type PrimeMode = 'phase1' | 'phase2'

export const PRIME_AMOUNTS: Record<PrimePalier, number> = {
  1: 25,
  2: 25,
  3: 50,
}

export const PRIME_TOTAL_EUR = 100
export const PRIME_APP_ID = 'moksha'

/**
 * Idempotence : 1 prime max par (user, app). UNIQUE constraint DB.
 */
export async function ensurePrimeRow(
  sb: SB,
  params: { userId: string; primeMode?: PrimeMode },
): Promise<{ created: boolean; error: string | null }> {
  const mode = params.primeMode ?? (process.env.PRIME_MODE as PrimeMode | undefined) ?? 'phase1'
  const { error } = await sb
    .from('moksha_primes_v4')
    .insert({
      user_id: params.userId,
      app_id: PRIME_APP_ID,
      prime_mode: mode,
      montant_total_eur: PRIME_TOTAL_EUR,
    })
  // UNIQUE violation → déjà existe (idempotent)
  if (error && error.code === '23505') {
    return { created: false, error: null }
  }
  if (error) return { created: false, error: error.message }
  return { created: true, error: null }
}

/**
 * Marque le N-ième paiement d'abonnement validé.
 * Appelé par webhook invoice.paid.
 */
export async function markSubscriptionPayment(
  sb: SB,
  params: { userId: string; paymentIndex: 1 | 2 | 3 },
): Promise<void> {
  const field = `subscription_payment_check_${params.paymentIndex}` as const
  await sb
    .from('moksha_primes_v4')
    .update({ [field]: true, palier_suspended: false })
    .eq('user_id', params.userId)
    .eq('app_id', PRIME_APP_ID)
}

/**
 * Suspend le palier courant si prélèvement échoue.
 * Appelé par webhook invoice.payment_failed.
 */
export async function suspendPrimePalier(
  sb: SB,
  params: { userId: string },
): Promise<void> {
  await sb
    .from('moksha_primes_v4')
    .update({ palier_suspended: true })
    .eq('user_id', params.userId)
    .eq('app_id', PRIME_APP_ID)
}

interface PrimeRow {
  user_id: string
  app_id: string
  palier_actuel: number
  montant_verse_eur: number
  prime_mode: PrimeMode
  subscription_payment_check_1: boolean
  subscription_payment_check_2: boolean
  subscription_payment_check_3: boolean
  palier_suspended: boolean
  recuperee: boolean
}

/**
 * Verse un palier: transfert Stripe vers Connect + MAJ wallet + MAJ primes_v4.
 * Idempotent via idempotencyKey Stripe + transaction DB.
 */
export async function disbursePrimePalier(
  sb: SB,
  params: { userId: string; palier: PrimePalier; stripeAccountId: string },
): Promise<{ success: boolean; transferId: string | null; error: string | null }> {
  const amount = PRIME_AMOUNTS[params.palier]
  const idempotencyKey = `prime_${params.userId}_${PRIME_APP_ID}_p${params.palier}`

  try {
    // Transfer Stripe
    const transfer = await transferToConnect({
      stripeAccountId: params.stripeAccountId,
      amountCents: Math.round(amount * 100),
      description: `Prime MOKSHA palier ${params.palier} (${amount}€)`,
      metadata: {
        user_id: params.userId,
        app_id: PRIME_APP_ID,
        palier: String(params.palier),
      },
      idempotencyKey,
    })

    // MAJ prime
    const dateField = `palier_${params.palier}_date` as const
    const transferField = `palier_${params.palier}_transfer_id` as const
    await sb
      .from('moksha_primes_v4')
      .update({
        palier_actuel: params.palier,
        montant_verse_eur: params.palier === 1 ? 25 : params.palier === 2 ? 50 : 100,
        [dateField]: new Date().toISOString(),
        [transferField]: transfer.id,
      })
      .eq('user_id', params.userId)
      .eq('app_id', PRIME_APP_ID)

    // Log wallet transaction
    await sb.from('moksha_wallet_transactions').insert({
      user_id: params.userId,
      type: `prime_palier_${params.palier}`,
      amount,
      description: `Prime MOKSHA palier ${params.palier} (J${params.palier === 1 ? '1' : params.palier === 2 ? '30' : '60'})`,
      statut: 'completed',
      direction: 'credit',
      source: 'prime_v4',
      stripe_transfer_id: transfer.id,
    })

    // MAJ wallet matérialisé
    await sb.rpc('apply_wallet_transaction_v4', {
      p_user_id: params.userId,
      p_amount: amount,
      p_direction: 'credit',
    })

    // Notification
    await sb.from('moksha_notifications').insert({
      user_id: params.userId,
      type: 'prime_v4',
      titre: `+${amount}€ prime palier ${params.palier} 🎁`,
      message: `Versée en euros réels sur ton compte Stripe Connect. Retrait SEPA instant vers ton IBAN.`,
      action_url: '/dashboard/wallet',
    })

    return { success: true, transferId: transfer.id, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Transfer failed'
    return { success: false, transferId: null, error: msg }
  }
}

/**
 * Calcule quels paliers peuvent être versés maintenant pour un user.
 * Règle: prime versée seulement si subscription_payment_check_N=true ET palier_actuel < N.
 */
export function computePayablePaliers(prime: PrimeRow): PrimePalier[] {
  if (prime.recuperee || prime.palier_suspended) return []
  const payable: PrimePalier[] = []
  if (prime.subscription_payment_check_1 && prime.palier_actuel < 1) payable.push(1)
  if (prime.subscription_payment_check_2 && prime.palier_actuel < 2) payable.push(2)
  if (prime.subscription_payment_check_3 && prime.palier_actuel < 3) payable.push(3)
  return payable
}

/**
 * Récupère les primes versées au prorata (rétractation <30j).
 * Appelé par webhook charge.refunded.
 */
export async function reclaimPrime(
  sb: SB,
  params: { userId: string },
): Promise<{ deducted: number }> {
  const { data: prime } = await sb
    .from('moksha_primes_v4')
    .select('montant_verse_eur, recuperee')
    .eq('user_id', params.userId)
    .eq('app_id', PRIME_APP_ID)
    .maybeSingle<{ montant_verse_eur: number; recuperee: boolean }>()
  if (!prime || prime.recuperee) return { deducted: 0 }

  const deducted = Number(prime.montant_verse_eur || 0)
  if (deducted > 0) {
    await sb.from('moksha_wallet_transactions').insert({
      user_id: params.userId,
      type: 'refund',
      amount: -deducted,
      description: `Rétractation <30j — prime récupérée au prorata (art. L221-28)`,
      statut: 'completed',
      direction: 'debit',
      source: 'prime_v4_reclaim',
    })
    await sb.rpc('apply_wallet_transaction_v4', {
      p_user_id: params.userId,
      p_amount: deducted,
      p_direction: 'debit',
    })
  }
  await sb
    .from('moksha_primes_v4')
    .update({ recuperee: true, recuperee_at: new Date().toISOString() })
    .eq('user_id', params.userId)
    .eq('app_id', PRIME_APP_ID)
  return { deducted }
}
