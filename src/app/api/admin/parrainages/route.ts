import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const svc = createServiceClient()

  // Top parrains: count + somme commissions
  const { data: refs } = await svc
    .from('moksha_referrals')
    .select('referrer_id, statut, commission_amount, created_at')

  const map = new Map<string, { filleuls: number; gains: number; actifs: number }>()
  for (const r of refs || []) {
    const k = r.referrer_id
    const cur = map.get(k) || { filleuls: 0, gains: 0, actifs: 0 }
    cur.filleuls += 1
    cur.gains += Number(r.commission_amount || 0)
    if (r.statut === 'active' || r.statut === 'paid') cur.actifs += 1
    map.set(k, cur)
  }

  const ids = Array.from(map.keys())
  const { data: profs } = ids.length
    ? await svc
        .from('moksha_profiles')
        .select('id, email, full_name, referral_code')
        .in('id', ids)
    : { data: [] as Array<{ id: string; email: string; full_name: string | null; referral_code: string }> }

  const top = (profs || [])
    .map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      referral_code: p.referral_code,
      ...map.get(p.id)!,
    }))
    .sort((a, b) => b.filleuls - a.filleuls)
    .slice(0, 100)

  const totalRefs = (refs || []).length
  const totalGains = (refs || []).reduce((s, r) => s + Number(r.commission_amount || 0), 0)
  const actifs = (refs || []).filter((r) => r.statut === 'active' || r.statut === 'paid').length

  return NextResponse.json({
    summary: { total: totalRefs, actifs, gains: totalGains },
    top,
  })
}
