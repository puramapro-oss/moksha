import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { sendEmail, emailTemplates } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 180

/**
 * CRON moksha_wrapped_monthly — 1er du mois à 9h
 * Calcule les stats du mois précédent pour chaque user actif et envoie le wrapped.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } },
  )

  const now = new Date()
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthName = firstOfLastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const start = firstOfLastMonth.toISOString()
  const end = firstOfThisMonth.toISOString()

  // Users ayant une activité le mois dernier
  const { data: activeUsers } = await sb
    .from('moksha_point_transactions')
    .select('user_id')
    .gte('created_at', start)
    .lt('created_at', end)

  const uniqueIds = Array.from(new Set((activeUsers ?? []).map((u) => u.user_id)))
  let sent = 0

  for (const userId of uniqueIds) {
    // Already sent?
    const emailType = `wrapped_${firstOfLastMonth.getFullYear()}_${firstOfLastMonth.getMonth() + 1}`
    const { data: existing } = await sb
      .from('moksha_email_sequences')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', emailType)
      .maybeSingle()
    if (existing) continue

    const { data: profile } = await sb
      .from('moksha_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .maybeSingle()
    if (!profile?.email) continue

    // Aggrégation stats
    const [pts, grat, breath, dossiers] = await Promise.all([
      sb
        .from('moksha_point_transactions')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', start)
        .lt('created_at', end),
      sb
        .from('moksha_gratitude_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start)
        .lt('created_at', end),
      sb
        .from('moksha_breath_sessions')
        .select('duration_seconds')
        .eq('user_id', userId)
        .gte('created_at', start)
        .lt('created_at', end),
      sb
        .from('moksha_dossiers_financement')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start)
        .lt('created_at', end),
    ])

    const points = (pts.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
    const gratitudes = grat.count ?? 0
    const breath_min = Math.round(
      ((breath.data ?? []).reduce((s, b) => s + (b.duration_seconds ?? 0), 0)) / 60,
    )
    const dossiersCount = dossiers.count ?? 0

    const firstName = profile.full_name?.split(' ')[0] ?? 'entrepreneur'
    const html = emailTemplates.wrapped(
      firstName,
      { points, gratitudes, breath_min, dossiers: dossiersCount },
      monthName,
    )

    const ok = await sendEmail({
      to: profile.email,
      subject: `Ton wrapped ${monthName} 🔥`,
      html,
    })

    if (ok) {
      await sb.from('moksha_email_sequences').insert({
        user_id: userId,
        email_type: emailType,
      })
      sent++
    }
  }

  return NextResponse.json({ ok: true, month: monthName, eligible: uniqueIds.length, sent })
}
