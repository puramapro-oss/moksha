import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAuthorizedCron } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * CRON moksha_weekly_contest — chaque dimanche 23h59
 * Calcule le classement hebdo:
 *   score = parrainages×10 + abos_payants×50 + jours_actifs×5 + gratitudes×3
 * Upsert les top 100 dans moksha_contest_leaderboard pour la période IYYY-IW courante.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } },
  )

  // Période IYYY-IW (ISO week)
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const period = `${d.getUTCFullYear()}-${String(weekNum).padStart(2, '0')}`

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  // Récupère tous les profils
  const { data: profiles, error: pErr } = await sb
    .from('moksha_profiles')
    .select('id, full_name, plan')

  if (pErr || !profiles) {
    return NextResponse.json({ error: pErr?.message ?? 'profiles fetch failed' }, { status: 500 })
  }

  const scores: { user_id: string; full_name: string; score: number; period: string }[] = []

  for (const p of profiles) {
    // Parrainages actifs de la semaine
    const { count: refCount } = await sb
      .from('moksha_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', p.id)
      .gte('created_at', weekAgo)

    // Jours actifs (via transactions de points cette semaine)
    const { data: txDays } = await sb
      .from('moksha_point_transactions')
      .select('created_at')
      .eq('user_id', p.id)
      .gte('created_at', weekAgo)

    const distinctDays = new Set(
      (txDays ?? []).map((t) => new Date(t.created_at).toISOString().slice(0, 10)),
    ).size

    // Gratitudes de la semaine
    const { count: gratCount } = await sb
      .from('moksha_gratitude_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', p.id)
      .gte('created_at', weekAgo)

    const abo = p.plan && p.plan !== 'gratuit' ? 1 : 0
    const score =
      (refCount ?? 0) * 10 + abo * 50 + distinctDays * 5 + (gratCount ?? 0) * 3

    if (score > 0) {
      scores.push({
        user_id: p.id,
        full_name: p.full_name ?? 'Anonyme',
        score,
        period,
      })
    }
  }

  // Trier puis garder top 100
  scores.sort((a, b) => b.score - a.score)
  const top = scores.slice(0, 100).map((s, i) => ({ ...s, rank: i + 1 }))

  // Upsert dans leaderboard
  if (top.length > 0) {
    const { error: upErr } = await sb
      .from('moksha_contest_leaderboard')
      .upsert(top, { onConflict: 'user_id' })

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    period,
    scored: scores.length,
    persisted: top.length,
    top3: top.slice(0, 3).map((t) => ({ rank: t.rank, name: t.full_name, score: t.score })),
  })
}
