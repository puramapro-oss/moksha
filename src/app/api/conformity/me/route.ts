import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { computeStructureScore, type ConformityChecks } from '@/lib/conformity'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const svc = createServiceClient()
  const { data: structures } = await svc
    .from('moksha_structures')
    .select('id, user_id, type, forme, denomination, siren, adresse_siege, capital_social, statut, code_ape, activite, kbis_url')
    .eq('user_id', user.id)

  if (!structures || structures.length === 0) {
    // Pas encore de structure : score basé sur profil/onboarding
    const { count: docCount } = await svc
      .from('moksha_documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const baseScore = Math.min(40 + (docCount ?? 0) * 5, 50)
    return NextResponse.json({
      score: baseScore,
      color: 'orange',
      structures: [],
      message: 'Crée ta première structure pour démarrer le calcul de conformité.',
    })
  }

  const results: Array<{
    id: string
    denomination: string | null
    score: number
    color: string
    checks: ConformityChecks
  }> = []
  for (const s of structures) {
    const r = await computeStructureScore(svc, s)
    results.push({ id: s.id, denomination: s.denomination, ...r })
    // Persist pour le cron / future lecture
    await svc
      .from('moksha_structures')
      .update({
        metadata: {
          score: r.score,
          score_color: r.color,
          score_checks: r.checks,
          score_updated_at: new Date().toISOString(),
        },
      })
      .eq('id', s.id)
  }

  const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
  const color = avg >= 80 ? 'vert' : avg >= 50 ? 'orange' : 'rouge'

  return NextResponse.json({ score: avg, color, structures: results })
}
