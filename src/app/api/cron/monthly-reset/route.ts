import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAuthorizedCron } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * CRON moksha_monthly_reset — 1er du mois à minuit
 * Reset le compteur JurisIA gratuit + archive les concours expirés + stats admin.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )

  const today = new Date().toISOString().slice(0, 10)
  // Reset compteur JurisIA pour tout le monde
  const { error: errReset } = await sb
    .from('moksha_profiles')
    .update({ jurisia_questions_today: 0, jurisia_reset_date: today })
    .gte('jurisia_questions_today', 0)

  if (errReset) return NextResponse.json({ error: errReset.message }, { status: 500 })

  // Désactiver les concours terminés
  const { data: concours } = await sb
    .from('moksha_concours')
    .select('id, titre, date_fin, actif')
    .lt('date_fin', new Date().toISOString())
    .eq('actif', true)

  for (const c of concours || []) {
    await sb.from('moksha_concours').update({ actif: false }).eq('id', c.id)
  }

  // Stats globales
  const [users, demarches, payants] = await Promise.all([
    sb.from('moksha_profiles').select('id', { count: 'exact', head: true }),
    sb.from('moksha_demarches').select('id', { count: 'exact', head: true }),
    sb.from('moksha_profiles').select('id', { count: 'exact', head: true }).neq('plan', 'gratuit'),
  ])

  return NextResponse.json({
    ok: true,
    reset_jurisia: true,
    concours_archived: concours?.length ?? 0,
    stats: {
      users: users.count ?? 0,
      demarches: demarches.count ?? 0,
      payants: payants.count ?? 0,
    },
  })
}
