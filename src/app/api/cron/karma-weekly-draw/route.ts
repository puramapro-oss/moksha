import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { transferToConnect } from '@/lib/stripe-connect'
import { getCurrentDrawPeriod } from '@/lib/karma-tickets'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * CRON dim 23h59 — tirage karma hebdomadaire.
 * Pool = 2% CA semaine, min 10€. 1 gagnant.
 * Tirage pseudo-aléatoire (crypto.getRandomValues), seed stocké pour traçabilité.
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

  const period = getCurrentDrawPeriod('week')

  // Vérifie si le tirage a déjà eu lieu (idempotent)
  const { data: existing } = await sb
    .from('moksha_karma_draws')
    .select('id, status')
    .eq('type', 'week')
    .eq('period', period)
    .maybeSingle()

  if (existing?.status === 'drawn' || existing?.status === 'paid') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already drawn', period })
  }

  // Pool = 2% CA semaine (approx via subscriptions actives × 29,99 × 7/30)
  const { count: activeSubs } = await sb
    .from('moksha_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  const weeklyRevenue = Math.max(10, (activeSubs ?? 0) * 29.99 * (7 / 30))
  const pool = Math.max(10, weeklyRevenue * 0.02)

  // Collecte tickets actifs
  const { data: tickets } = await sb
    .from('moksha_karma_tickets')
    .select('id, user_id, multiplier')
    .eq('draw_type', 'week')
    .eq('draw_period', period)
    .eq('used', false)

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ ok: true, no_tickets: true, period })
  }

  // Pondération par multiplicateur
  const weighted: string[] = []
  for (const t of tickets) {
    const mult = Math.max(1, Number(t.multiplier ?? 1))
    for (let i = 0; i < mult; i++) weighted.push(t.user_id)
  }

  // Tirage pseudo-aléatoire
  const seed = `week-${period}-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`
  const winnerIndex = Math.abs(hashSeed(seed)) % weighted.length
  const winnerUserId = weighted[winnerIndex]

  // Insert/update draw
  const drawId = existing?.id ??
    (await sb
      .from('moksha_karma_draws')
      .insert({
        type: 'week',
        period,
        pool_eur: pool,
        draw_date: new Date().toISOString(),
        random_seed: seed,
        status: 'drawn',
        winners_count: 1,
      })
      .select('id')
      .single<{ id: string }>()).data?.id

  if (existing?.id) {
    await sb
      .from('moksha_karma_draws')
      .update({ status: 'drawn', random_seed: seed, draw_date: new Date().toISOString(), pool_eur: pool, winners_count: 1 })
      .eq('id', existing.id)
  }

  if (!drawId) {
    return NextResponse.json({ error: 'Impossible de créer le tirage' }, { status: 500 })
  }

  await sb.from('moksha_karma_winners').upsert(
    {
      draw_id: drawId,
      user_id: winnerUserId,
      rank: 1,
      amount_eur: pool,
    },
    { onConflict: 'draw_id,user_id' },
  )

  // Marque tickets used
  await sb
    .from('moksha_karma_tickets')
    .update({ used: true })
    .eq('draw_type', 'week')
    .eq('draw_period', period)

  // Tente versement via Connect
  const { data: connect } = await sb
    .from('moksha_connect_accounts')
    .select('stripe_account_id, payouts_enabled')
    .eq('user_id', winnerUserId)
    .maybeSingle<{ stripe_account_id: string; payouts_enabled: boolean }>()

  let transferId: string | null = null
  if (connect?.stripe_account_id && connect.payouts_enabled) {
    try {
      const transfer = await transferToConnect({
        stripeAccountId: connect.stripe_account_id,
        amountCents: Math.round(pool * 100),
        description: `Gain KARMA tirage hebdo ${period}`,
        metadata: { draw_id: drawId, period, type: 'week' },
        idempotencyKey: `draw_week_${period}`,
      })
      transferId = transfer.id
      await sb.from('moksha_karma_winners').update({ stripe_transfer_id: transfer.id, paid_at: new Date().toISOString() }).eq('draw_id', drawId).eq('user_id', winnerUserId)
      await sb.from('moksha_karma_draws').update({ status: 'paid' }).eq('id', drawId)
      await sb.from('moksha_wallet_transactions').insert({
        user_id: winnerUserId,
        type: 'karma_prize_week',
        amount: pool,
        description: `Gagnant tirage hebdo ${period}`,
        statut: 'completed',
        direction: 'credit',
        source: 'karma_draw',
        source_id: drawId,
        stripe_transfer_id: transfer.id,
      })
      await sb.rpc('apply_wallet_transaction_v4', {
        p_user_id: winnerUserId,
        p_amount: pool,
        p_direction: 'credit',
      })
    } catch (e) {
      return NextResponse.json({ ok: true, winner: winnerUserId, pool, transfer_error: e instanceof Error ? e.message : 'transfer failed' })
    }
  }

  // Notification
  await sb.from('moksha_karma_winners').update({ notified_at: new Date().toISOString() }).eq('draw_id', drawId).eq('user_id', winnerUserId)
  await sb.from('moksha_notifications').insert({
    user_id: winnerUserId,
    type: 'karma_win',
    titre: `🎉 Tu as gagné ${pool.toFixed(2)}€ au tirage hebdo !`,
    message: `Période ${period}. ${transferId ? 'Versement en cours sur ton Stripe Connect.' : 'Active ton Stripe Connect pour recevoir ton gain.'}`,
    action_url: '/dashboard/wallet',
  })

  return NextResponse.json({
    ok: true,
    period,
    pool_eur: pool,
    winner_user_id: winnerUserId,
    transfer_id: transferId,
    tickets_count: weighted.length,
  })
}

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return h
}
