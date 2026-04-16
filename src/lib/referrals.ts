// V7 §10 — Parrainage V4 3 niveaux
// N1 filleul direct=50% | N2=15% | N3=7% (à vie)
// Versement auto J facturation (checkout + invoice.payment_succeeded).

import type { SupabaseClient } from '@supabase/supabase-js'

export const REFERRAL_RATES = { 1: 0.5, 2: 0.15, 3: 0.07 } as const

// Accept any schema-scoped SupabaseClient (caller sets db.schema at creation).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>

/**
 * Remonte la chaîne de parrainage à partir d'un filleul (refereeId).
 * Renvoie {N1, N2, N3} (null si absent).
 */
export async function getReferralChain(
  sb: SB,
  refereeId: string
): Promise<{ n1: string | null; n2: string | null; n3: string | null }> {
  const { data: p1 } = await sb
    .from('moksha_profiles')
    .select('id, referred_by')
    .eq('id', refereeId)
    .maybeSingle()
  const n1 = p1?.referred_by ?? null
  if (!n1) return { n1: null, n2: null, n3: null }

  const { data: p2 } = await sb
    .from('moksha_profiles')
    .select('referred_by')
    .eq('id', n1)
    .maybeSingle()
  const n2 = p2?.referred_by ?? null
  if (!n2) return { n1, n2: null, n3: null }

  const { data: p3 } = await sb
    .from('moksha_profiles')
    .select('referred_by')
    .eq('id', n2)
    .maybeSingle()
  const n3 = p3?.referred_by ?? null
  return { n1, n2, n3 }
}

/**
 * Verse les commissions N1/N2/N3 sur un paiement filleul (1er ou récurrent).
 * Idempotent via description `Commission N{level} — ${invoiceId || subId}`.
 */
export async function payReferralCommissions(
  sb: SB,
  params: {
    refereeId: string
    amountPaidEur: number
    idempotencyKey: string
    planLabel?: string | null
  }
) {
  const { refereeId, amountPaidEur, idempotencyKey, planLabel } = params
  if (!refereeId || amountPaidEur <= 0) return

  const chain = await getReferralChain(sb, refereeId)

  const entries: Array<{ level: 1 | 2 | 3; receiverId: string | null }> = [
    { level: 1, receiverId: chain.n1 },
    { level: 2, receiverId: chain.n2 },
    { level: 3, receiverId: chain.n3 },
  ]

  for (const { level, receiverId } of entries) {
    if (!receiverId) continue
    const rate = REFERRAL_RATES[level]
    const commission = Math.round(amountPaidEur * rate * 100) / 100
    if (commission <= 0) continue
    const description = `Commission N${level} — ${idempotencyKey}`

    // Idempotence : skip si déjà inséré
    const { data: exists } = await sb
      .from('moksha_wallet_transactions')
      .select('id')
      .eq('user_id', receiverId)
      .eq('type', 'commission')
      .eq('description', description)
      .maybeSingle()
    if (exists) continue

    await sb.from('moksha_wallet_transactions').insert({
      user_id: receiverId,
      type: 'commission',
      amount: commission,
      description,
      statut: 'completed',
    })

    // Track on referrals table (level row for each N2/N3 relation)
    await sb.from('moksha_referrals').upsert(
      {
        referrer_id: receiverId,
        referee_id: refereeId,
        code_used: `N${level}`,
        statut: 'active',
        level,
        commission_amount: commission,
        active: true,
      },
      { onConflict: 'referrer_id,referee_id,level', ignoreDuplicates: false }
    )

    await sb.from('moksha_notifications').insert({
      user_id: receiverId,
      type: 'commission',
      titre:
        level === 1
          ? `+${commission.toFixed(2)}€ encaissés 🔥`
          : `+${commission.toFixed(2)}€ via niveau ${level}`,
      message:
        level === 1
          ? `Ton filleul direct vient d'être facturé${planLabel ? ` (${planLabel})` : ''}.`
          : `Commission niveau ${level} sur la facturation d'un filleul indirect.`,
      action_url: '/dashboard/parrainage',
    })
  }
}
