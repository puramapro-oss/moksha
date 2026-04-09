import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const svc = createServiceClient()
  const { data: txs } = await svc
    .from('moksha_wallet_transactions')
    .select('id, user_id, type, amount, description, statut, created_at, stripe_payout_id')
    .order('created_at', { ascending: false })
    .limit(500)

  const totals = { in: 0, out: 0, pending: 0 }
  const userBalances = new Map<string, number>()

  for (const t of txs || []) {
    if (t.statut !== 'completed' && t.type !== 'retrait') continue
    const amt = Number(t.amount)
    if (t.type === 'retrait') {
      if (t.statut === 'pending') totals.pending += Math.abs(amt)
      else if (t.statut === 'completed') totals.out += Math.abs(amt)
      const cur = userBalances.get(t.user_id) || 0
      if (t.statut === 'completed') userBalances.set(t.user_id, cur - Math.abs(amt))
    } else if (t.statut === 'completed') {
      totals.in += amt
      const cur = userBalances.get(t.user_id) || 0
      userBalances.set(t.user_id, cur + amt)
    }
  }

  const ids = Array.from(new Set((txs || []).map((t) => t.user_id)))
  const { data: profs } = ids.length
    ? await svc.from('moksha_profiles').select('id, email, full_name').in('id', ids)
    : { data: [] as Array<{ id: string; email: string; full_name: string | null }> }
  const profMap = new Map((profs || []).map((p) => [p.id, p]))

  return NextResponse.json({
    totals: {
      ...totals,
      net: totals.in - totals.out,
    },
    transactions: (txs || []).map((t) => ({
      ...t,
      user_email: profMap.get(t.user_id)?.email || '—',
      user_name: profMap.get(t.user_id)?.full_name || '—',
    })),
    balances: Array.from(userBalances.entries())
      .map(([uid, bal]) => ({
        user_id: uid,
        email: profMap.get(uid)?.email || '—',
        full_name: profMap.get(uid)?.full_name || '—',
        balance: bal,
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 100),
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const { id, statut, stripe_payout_id } = (await req.json()) as {
    id?: string
    statut?: 'pending' | 'completed' | 'failed'
    stripe_payout_id?: string | null
  }
  if (!id || !statut) return NextResponse.json({ error: 'id + statut requis' }, { status: 400 })

  const svc = createServiceClient()
  const update: Record<string, unknown> = { statut }
  if (stripe_payout_id !== undefined) update.stripe_payout_id = stripe_payout_id
  const { error } = await svc.from('moksha_wallet_transactions').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
