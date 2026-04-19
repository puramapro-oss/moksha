import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import {
  computePayablePaliers,
  disbursePrimePalier,
  type PrimePalier,
} from '@/lib/primes-v4'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * CRON quotidien V4 — versement des primes éligibles (paliers J1/J30/J60).
 * Règle d'alignement: versement uniquement si abo payé (subscription_payment_check_N=true).
 *
 * Idempotent via Stripe idempotencyKey + MAJ primes_v4.palier_actuel.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } },
  )

  // Primes actives (palier < 3, non récupérées, non suspendues)
  const { data: primes, error: primesErr } = await sb
    .from('moksha_primes_v4')
    .select(`
      user_id, app_id, palier_actuel, montant_verse_eur, prime_mode,
      subscription_payment_check_1, subscription_payment_check_2, subscription_payment_check_3,
      palier_suspended, recuperee
    `)
    .lt('palier_actuel', 3)
    .eq('recuperee', false)
    .eq('palier_suspended', false)

  if (primesErr) {
    return NextResponse.json({ error: primesErr.message }, { status: 500 })
  }

  let paliersVerses = 0
  let transfersSkipped = 0
  const errors: string[] = []

  for (const prime of primes ?? []) {
    const payable = computePayablePaliers(prime)
    if (payable.length === 0) continue

    // Récupère le compte Connect
    const { data: connect } = await sb
      .from('moksha_connect_accounts')
      .select('stripe_account_id, payouts_enabled')
      .eq('user_id', prime.user_id)
      .maybeSingle()

    if (!connect?.stripe_account_id || !connect.payouts_enabled) {
      transfersSkipped += payable.length
      continue
    }

    // Verse chaque palier éligible
    for (const palier of payable as PrimePalier[]) {
      const result = await disbursePrimePalier(sb, {
        userId: prime.user_id,
        palier,
        stripeAccountId: connect.stripe_account_id,
      })
      if (result.success) paliersVerses++
      else errors.push(`${prime.user_id}/p${palier}: ${result.error}`)
    }
  }

  return NextResponse.json({
    ok: true,
    paliers_verses: paliersVerses,
    transfers_skipped_no_connect: transfersSkipped,
    errors: errors.slice(0, 10),
    ran_at: new Date().toISOString(),
  })
}
