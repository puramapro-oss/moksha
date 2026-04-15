import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// CRON quotidien — V7 §10 Prime 3 paliers (phase1)
// Tranche 1 = J+0 (via webhook checkout.session.completed)
// Tranche 2 = M+1 (30j) = +25€
// Tranche 3 = M+2 (60j) = +50€
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )

  const now = Date.now()
  const THIRTY_D = 30 * 24 * 3600 * 1000
  const SIXTY_D = 60 * 24 * 3600 * 1000

  // Profiles actifs payants avec subscription_started_at
  const { data: profiles } = await sb
    .from('moksha_profiles')
    .select('id, plan, subscription_started_at, stripe_subscription_id')
    .neq('plan', 'gratuit')
    .not('subscription_started_at', 'is', null)

  const tranches: Array<{ userId: string; tranche: 2 | 3; amount: number }> = []

  for (const p of profiles ?? []) {
    if (!p.subscription_started_at) continue
    const started = new Date(p.subscription_started_at).getTime()
    const age = now - started
    // Check résiliation/refund
    const { data: retract } = await sb
      .from('moksha_retractions')
      .select('id')
      .eq('user_id', p.id)
      .maybeSingle()
    if (retract) continue

    if (age >= THIRTY_D && age < THIRTY_D + 24 * 3600 * 1000) {
      tranches.push({ userId: p.id, tranche: 2, amount: 25 })
    }
    if (age >= SIXTY_D && age < SIXTY_D + 24 * 3600 * 1000) {
      tranches.push({ userId: p.id, tranche: 3, amount: 50 })
    }
  }

  let paid = 0
  for (const t of tranches) {
    const desc = `Prime bienvenue tranche ${t.tranche}/3 (M+${t.tranche === 2 ? 1 : 2})`
    const { data: exists } = await sb
      .from('moksha_wallet_transactions')
      .select('id')
      .eq('user_id', t.userId)
      .eq('type', 'prime')
      .eq('description', desc)
      .maybeSingle()
    if (exists) continue
    await sb.from('moksha_wallet_transactions').insert({
      user_id: t.userId,
      type: 'prime',
      amount: t.amount,
      description: desc,
      statut: 'completed',
    })
    await sb.from('moksha_notifications').insert({
      user_id: t.userId,
      type: 'prime',
      titre: `+${t.amount}€ prime tranche ${t.tranche}/3 🎁`,
      message: t.tranche === 3
        ? 'Dernière tranche de ta prime de bienvenue. Retrait disponible !'
        : 'Tranche suivante dans 30 jours.',
      action_url: '/dashboard/wallet',
    })
    paid++
  }

  return NextResponse.json({ ok: true, paid })
}
