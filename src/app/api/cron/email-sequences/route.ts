import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { sendEmail, emailTemplates } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 120

type Step = {
  type: keyof typeof emailTemplates
  day: number
  subject: string
}

const SEQUENCE: Step[] = [
  { type: 'seq_j1_astuce', day: 1, subject: 'Une astuce pour bien démarrer' },
  { type: 'seq_j3_relance', day: 3, subject: 'On ne t\'a pas vu depuis 2 jours' },
  { type: 'seq_j7_tips', day: 7, subject: '3 fonctionnalités que tu n\'as pas encore utilisées' },
  { type: 'seq_j14_upgrade', day: 14, subject: '-20% sur ton abonnement Pro pendant 48h' },
  { type: 'seq_j21_temoignage', day: 21, subject: 'Ce que MOKSHA fait vraiment' },
  { type: 'seq_j30_winback', day: 30, subject: 'On te garde ta place' },
]

/**
 * CRON moksha_email_sequences — chaque jour à 10h
 * Parcourt les users, envoie l'email adapté au jour d'inscription (J1/J3/J7/J14/J21/J30).
 * Dédup via moksha_email_sequences (user_id, email_type).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } },
  )

  const results: Record<string, number> = {}

  for (const step of SEQUENCE) {
    const target = new Date()
    target.setDate(target.getDate() - step.day)
    const dayStart = new Date(target.setHours(0, 0, 0, 0)).toISOString()
    const dayEnd = new Date(target.setHours(23, 59, 59, 999)).toISOString()

    const { data: profiles } = await sb
      .from('moksha_profiles')
      .select('id, email, full_name, plan')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)

    if (!profiles || profiles.length === 0) {
      results[step.type] = 0
      continue
    }

    let sent = 0
    for (const p of profiles) {
      // Already sent?
      const { data: existing } = await sb
        .from('moksha_email_sequences')
        .select('id')
        .eq('user_id', p.id)
        .eq('email_type', step.type)
        .maybeSingle()

      if (existing) continue

      // J14 upgrade: skip if déjà payant
      if (step.type === 'seq_j14_upgrade' && p.plan && p.plan !== 'gratuit') {
        await sb.from('moksha_email_sequences').insert({
          user_id: p.id,
          email_type: step.type,
        })
        continue
      }

      const firstName = (p.full_name?.split(' ')[0] ?? 'entrepreneur') as string
      const tpl = emailTemplates[step.type]
      if (typeof tpl !== 'function') continue

      // @ts-expect-error template signatures vary mais chaque seq n'attend que le prénom
      const html: string = tpl(firstName)

      const ok = await sendEmail({ to: p.email, subject: step.subject, html })
      if (ok) {
        await sb.from('moksha_email_sequences').insert({
          user_id: p.id,
          email_type: step.type,
        })
        sent++
      }
    }

    results[step.type] = sent
  }

  return NextResponse.json({ ok: true, results })
}
