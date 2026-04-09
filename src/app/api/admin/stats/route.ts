import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase'
import { STRIPE_PRICES } from '@/lib/constants'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const svc = createServiceClient()

  const [usersAll, autopilote, pro, demarchesAll, demarchesAccepted, structuresAll, walletPending, refsAll] =
    await Promise.all([
      svc.from('moksha_profiles').select('id', { count: 'exact', head: true }),
      svc.from('moksha_profiles').select('id', { count: 'exact', head: true }).eq('plan', 'autopilote'),
      svc.from('moksha_profiles').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
      svc.from('moksha_demarches').select('id', { count: 'exact', head: true }),
      svc.from('moksha_demarches').select('id', { count: 'exact', head: true }).eq('statut', 'accepte'),
      svc.from('moksha_structures').select('id', { count: 'exact', head: true }),
      svc.from('moksha_wallet_transactions').select('amount').eq('statut', 'pending').eq('type', 'retrait'),
      svc.from('moksha_referrals').select('id', { count: 'exact', head: true }),
    ])

  const mrr =
    (autopilote.count ?? 0) * STRIPE_PRICES.autopilote_mensuel.price +
    (pro.count ?? 0) * STRIPE_PRICES.pro_mensuel.price

  const pendingPayouts = (walletPending.data || []).reduce((s, r) => s + Math.abs(Number(r.amount || 0)), 0)

  return NextResponse.json({
    users_total: usersAll.count ?? 0,
    users_autopilote: autopilote.count ?? 0,
    users_pro: pro.count ?? 0,
    users_payant: (autopilote.count ?? 0) + (pro.count ?? 0),
    demarches_total: demarchesAll.count ?? 0,
    demarches_acceptees: demarchesAccepted.count ?? 0,
    structures_total: structuresAll.count ?? 0,
    referrals_total: refsAll.count ?? 0,
    mrr,
    pending_payouts: pendingPayouts,
  })
}
