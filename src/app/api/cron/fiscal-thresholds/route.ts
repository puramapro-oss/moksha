import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend'

export const runtime = 'nodejs'

// CRON quotidien — V7 §17
// Vérifie les gains cumulés de l'année en cours et déclenche 1 notification / palier (1500, 2500, 3000)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )

  const year = new Date().getFullYear()
  const yearStart = `${year}-01-01`

  // Agrège gains/user
  const { data: txs } = await sb
    .from('moksha_wallet_transactions')
    .select('user_id, amount')
    .eq('statut', 'completed')
    .gte('created_at', yearStart)

  const byUser = new Map<string, number>()
  for (const t of txs ?? []) {
    byUser.set(t.user_id, (byUser.get(t.user_id) || 0) + Number(t.amount || 0))
  }

  let triggered = 0
  for (const [userId, total] of byUser.entries()) {
    for (const palier of [1500, 2500, 3000]) {
      if (total < palier) continue
      const { data: exists } = await sb
        .from('moksha_fiscal_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('palier', palier)
        .maybeSingle()
      if (exists) continue

      const { data: profile } = await sb
        .from('moksha_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      const messages: Record<number, { subject: string; html: string; inApp: string }> = {
        1500: {
          subject: 'Tu as gagné 1 500€ — info fiscale',
          html: `<p>Bonne nouvelle : tu as cumulé plus de 1 500€ sur MOKSHA cette année. À partir de 3 000€, tu devras déclarer. <strong>Aucune action requise pour l'instant.</strong></p>`,
          inApp: 'Tu as cumulé 1 500€ cette année. Seuil déclaration : 3 000€.',
        },
        2500: {
          subject: 'Plus que 500€ avant le seuil de déclaration',
          html: `<p>Tu as cumulé 2 500€ cette année. À 3 000€, tu devras déclarer via <a href="https://impots.gouv.fr">impots.gouv.fr</a> → case 5NG. Abattement 34% automatique.</p>`,
          inApp: 'Plus que 500€ avant le seuil 3 000€.',
        },
        3000: {
          subject: 'Seuil de 3 000€ atteint — déclaration nécessaire',
          html: `<p>Tu as dépassé 3 000€ cumulés cette année. Pense à déclarer : <a href="https://impots.gouv.fr">impots.gouv.fr</a> → case 5NG. Abattement 34% auto = imposé sur 66%. MOKSHA t'envoie ton récapitulatif PDF en janvier.</p>`,
          inApp: 'Seuil 3 000€ atteint — pense à déclarer.',
        },
      }
      const msg = messages[palier]
      let emailSent = false
      if (profile?.email && msg) {
        try {
          await sendEmail({ to: profile.email, subject: msg.subject, html: msg.html })
          emailSent = true
        } catch {}
      }
      await sb.from('moksha_fiscal_notifications').insert({
        user_id: userId,
        palier,
        email_sent: emailSent,
        push_sent: false,
      })
      if (msg) {
        await sb.from('moksha_notifications').insert({
          user_id: userId,
          type: 'fiscal',
          titre: `Palier fiscal : ${palier}€`,
          message: msg.inApp,
          action_url: '/fiscal',
        })
      }
      triggered++
    }
  }

  return NextResponse.json({ ok: true, triggered })
}
