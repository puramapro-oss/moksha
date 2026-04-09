import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, emailTemplates } from '@/lib/resend'
import { isAuthorizedCron } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * CRON moksha_daily_reminders — 8h chaque jour
 * Parcourt les rappels et envoie des emails J-30 / J-7 / J-1 aux utilisateurs.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targets = [1, 7, 30].map((days) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  })

  const { data: rappels, error } = await sb
    .from('moksha_rappels')
    .select('id, user_id, titre, description, date_echeance, notifie')
    .eq('statut', 'actif')
    .in('date_echeance', targets)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sent: string[] = []

  for (const r of rappels || []) {
    const { data: profile } = await sb
      .from('moksha_profiles')
      .select('email, full_name')
      .eq('id', r.user_id)
      .single()
    if (!profile?.email) continue
    const ok = await sendEmail({
      to: profile.email,
      subject: `⏰ Rappel : ${r.titre}`,
      html: emailTemplates.rappel(r.titre, new Date(r.date_echeance).toLocaleDateString('fr-FR')),
    })
    if (ok) {
      await sb.from('moksha_rappels').update({ notifie: true }).eq('id', r.id)
      await sb.from('moksha_notifications').insert({
        user_id: r.user_id,
        type: 'rappel',
        titre: r.titre,
        message: r.description,
        action_url: '/dashboard/rappels',
      })
      sent.push(r.id)
    }
  }

  return NextResponse.json({ ok: true, processed: rappels?.length ?? 0, sent: sent.length })
}
