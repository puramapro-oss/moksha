import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { transferToConnect } from '@/lib/stripe-connect'
import { getCurrentDrawPeriod } from '@/lib/karma-tickets'

export const runtime = 'nodejs'
export const maxDuration = 180

/**
 * CRON 1er du mois 00:05 — tirage karma mensuel (3 gagnants 60/25/15%).
 * Pool = 3% CA mensuel, min 50€.
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

  // Le tirage concerne le mois qui vient de se terminer
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data: existing } = await sb
    .from('moksha_karma_draws')
    .select('id, status')
    .eq('type', 'month')
    .eq('period', period)
    .maybeSingle()

  if (existing?.status === 'drawn' || existing?.status === 'paid') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already drawn', period })
  }

  // Pool = 3% CA mensuel
  const { count: activeSubs } = await sb
    .from('moksha_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  const monthlyRevenue = Math.max(50, (activeSubs ?? 0) * 29.99)
  const pool = Math.max(50, monthlyRevenue * 0.03)

  const { data: tickets } = await sb
    .from('moksha_karma_tickets')
    .select('id, user_id, multiplier')
    .eq('draw_type', 'month')
    .eq('draw_period', period)
    .eq('used', false)

  if (!tickets || tickets.length === 0) {
    return NextResponse.json({ ok: true, no_tickets: true, period })
  }

  // Pondération
  const weighted: string[] = []
  for (const t of tickets) {
    const mult = Math.max(1, Number(t.multiplier ?? 1))
    for (let i = 0; i < mult; i++) weighted.push(t.user_id)
  }

  // Tirage 3 gagnants distincts
  const seed = `month-${period}-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`
  const winners = selectDistinctWinners(weighted, 3, seed)

  const distribution = [0.6, 0.25, 0.15]

  // Insert draw
  const drawId = existing?.id ?? (await sb
    .from('moksha_karma_draws')
    .insert({
      type: 'month',
      period,
      pool_eur: pool,
      draw_date: new Date().toISOString(),
      random_seed: seed,
      status: 'drawn',
      winners_count: winners.length,
    })
    .select('id')
    .single<{ id: string }>()).data?.id

  if (existing?.id) {
    await sb.from('moksha_karma_draws').update({ status: 'drawn', random_seed: seed, draw_date: new Date().toISOString(), pool_eur: pool, winners_count: winners.length }).eq('id', existing.id)
  }

  if (!drawId) return NextResponse.json({ error: 'Impossible' }, { status: 500 })

  // Persist winners + transferts
  const results: Array<{ user_id: string; rank: number; amount: number; transfer_id: string | null }> = []
  for (let i = 0; i < winners.length; i++) {
    const userId = winners[i]
    const rank = i + 1
    const amount = pool * distribution[i]

    await sb.from('moksha_karma_winners').upsert({
      draw_id: drawId,
      user_id: userId,
      rank,
      amount_eur: amount,
    }, { onConflict: 'draw_id,user_id' })

    const { data: connect } = await sb
      .from('moksha_connect_accounts')
      .select('stripe_account_id, payouts_enabled')
      .eq('user_id', userId)
      .maybeSingle<{ stripe_account_id: string; payouts_enabled: boolean }>()

    let transferId: string | null = null
    if (connect?.stripe_account_id && connect.payouts_enabled) {
      try {
        const transfer = await transferToConnect({
          stripeAccountId: connect.stripe_account_id,
          amountCents: Math.round(amount * 100),
          description: `Gain KARMA tirage mensuel ${period} (rang ${rank})`,
          metadata: { draw_id: drawId, period, type: 'month', rank: String(rank) },
          idempotencyKey: `draw_month_${period}_${rank}`,
        })
        transferId = transfer.id
        await sb.from('moksha_karma_winners').update({ stripe_transfer_id: transfer.id, paid_at: new Date().toISOString() }).eq('draw_id', drawId).eq('user_id', userId)
        await sb.from('moksha_wallet_transactions').insert({
          user_id: userId,
          type: 'karma_prize_month',
          amount,
          description: `Gagnant tirage mensuel ${period} (rang ${rank})`,
          statut: 'completed',
          direction: 'credit',
          source: 'karma_draw',
          source_id: drawId,
          stripe_transfer_id: transfer.id,
        })
        await sb.rpc('apply_wallet_transaction_v4', { p_user_id: userId, p_amount: amount, p_direction: 'credit' })
      } catch {
        // transfer failed — retry manuel admin
      }
    }

    await sb.from('moksha_notifications').insert({
      user_id: userId,
      type: 'karma_win',
      titre: `🏆 Top ${rank} — ${amount.toFixed(2)}€ !`,
      message: `Tirage mensuel ${period}. ${transferId ? 'Versement en cours.' : 'Active ton Stripe Connect pour recevoir.'}`,
      action_url: '/dashboard/wallet',
    })

    results.push({ user_id: userId, rank, amount, transfer_id: transferId })
  }

  // Tous versés?
  const allPaid = results.every((r) => r.transfer_id !== null)
  if (allPaid) await sb.from('moksha_karma_draws').update({ status: 'paid' }).eq('id', drawId)

  await sb
    .from('moksha_karma_tickets')
    .update({ used: true })
    .eq('draw_type', 'month')
    .eq('draw_period', period)

  return NextResponse.json({
    ok: true,
    period,
    pool_eur: pool,
    winners: results,
    tickets_count: weighted.length,
  })
}

function selectDistinctWinners(pool: string[], count: number, seed: string): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  let iterSeed = seed
  while (result.length < count && result.length < new Set(pool).size) {
    iterSeed = `${iterSeed}-${result.length}`
    const hash = hashSeed(iterSeed)
    const index = Math.abs(hash) % pool.length
    const winner = pool[index]
    if (!seen.has(winner)) {
      seen.add(winner)
      result.push(winner)
    }
  }
  return result
}

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return h
}
