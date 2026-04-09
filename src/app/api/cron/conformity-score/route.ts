import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAuthorizedCron } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * CRON moksha_conformity_score — toutes les 3h
 * Recalcule le score de conformité par structure (10 critères).
 * Stocke le résultat dans moksha_structures.metadata.score + génère notif si baisse.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )

  const { data: structures, error } = await sb
    .from('moksha_structures')
    .select('id, user_id, type, forme, denomination, siren, siret, adresse_siege, capital_social, statut, metadata, code_ape, activite, kbis_url')
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let updated = 0

  for (const s of structures || []) {
    const checks = {
      denomination: !!s.denomination,
      siege: !!s.adresse_siege,
      ape: !!s.code_ape,
      activite: !!s.activite,
      capital: s.type === 'entreprise' ? (s.capital_social ?? 0) > 0 : true,
      immatricule: s.type === 'entreprise' ? !!s.siren : true,
      kbis: s.statut === 'accepte' ? !!s.kbis_url : true,
      statut_ok: s.statut !== 'refuse',
      docs: true, // enrichi ci-dessous
      rappels: true, // enrichi ci-dessous
    }

    // Documents uploadés ?
    const { count: docCount } = await sb
      .from('moksha_documents')
      .select('id', { count: 'exact', head: true })
      .eq('structure_id', s.id)
    checks.docs = (docCount ?? 0) >= 2

    // Rappels en retard ?
    const { count: lateCount } = await sb
      .from('moksha_rappels')
      .select('id', { count: 'exact', head: true })
      .eq('structure_id', s.id)
      .eq('statut', 'actif')
      .lt('date_echeance', new Date().toISOString().slice(0, 10))
    checks.rappels = (lateCount ?? 0) === 0

    const passed = Object.values(checks).filter(Boolean).length
    const score = Math.round((passed / 10) * 100)
    const color = score >= 80 ? 'vert' : score >= 50 ? 'orange' : 'rouge'

    const currentMeta = (s.metadata as Record<string, unknown>) || {}
    const oldScore = typeof currentMeta.score === 'number' ? currentMeta.score : null

    await sb
      .from('moksha_structures')
      .update({
        metadata: {
          ...currentMeta,
          score,
          score_color: color,
          score_checks: checks,
          score_updated_at: new Date().toISOString(),
        },
      })
      .eq('id', s.id)
    updated++

    // Notification si baisse importante
    if (oldScore !== null && oldScore - score >= 10) {
      await sb.from('moksha_notifications').insert({
        user_id: s.user_id,
        type: 'score_baisse',
        titre: `Score de conformité en baisse — ${s.denomination ?? 'Structure'}`,
        message: `Ton score est passé de ${oldScore}% à ${score}%.`,
        action_url: '/dashboard/structures',
      })
    }
  }

  return NextResponse.json({ ok: true, updated })
}
