import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend'
import { isAuthorizedCron } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * CRON moksha_weekly_report — lundi 9h
 * Envoie le récap hebdo à chaque utilisateur actif.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoIso = weekAgo.toISOString()

  const { data: users } = await sb
    .from('moksha_profiles')
    .select('id, email, full_name, plan')
    .neq('plan', 'gratuit')
    .limit(2000)

  let sent = 0

  for (const u of users || []) {
    const [demarches, docs, rappels] = await Promise.all([
      sb
        .from('moksha_demarches')
        .select('id, titre, statut')
        .eq('user_id', u.id)
        .gte('updated_at', weekAgoIso),
      sb
        .from('moksha_documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', u.id)
        .gte('created_at', weekAgoIso),
      sb
        .from('moksha_rappels')
        .select('id, titre, date_echeance')
        .eq('user_id', u.id)
        .eq('statut', 'actif')
        .gte('date_echeance', new Date().toISOString().slice(0, 10))
        .order('date_echeance', { ascending: true })
        .limit(5),
    ])

    const demarchesCount = demarches.data?.length ?? 0
    const docsCount = docs.count ?? 0
    const upcoming = rappels.data ?? []

    if (demarchesCount === 0 && docsCount === 0 && upcoming.length === 0) continue

    const upcomingList = upcoming
      .map(
        (r) =>
          `<li style="margin:6px 0;"><strong>${r.titre}</strong> — ${new Date(r.date_echeance).toLocaleDateString('fr-FR')}</li>`
      )
      .join('')

    const html = `
<!DOCTYPE html>
<html><body style="font-family:'DM Sans',Arial,sans-serif;background:#070B18;color:#F8FAFC;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#0D1225;border-radius:16px;padding:40px;border:1px solid rgba(255, 61, 0,0.2);">
    <h1 style="background:linear-gradient(135deg,#FF3D00,#FFB300);-webkit-background-clip:text;background-clip:text;color:transparent;font-family:'Syne',sans-serif;font-weight:800;font-size:28px;margin:0 0 4px 0;">MOKSHA</h1>
    <p style="color:#94A3B8;font-size:12px;margin:0 0 24px;">Ton récap de la semaine</p>
    <h2 style="color:#FFB300;font-family:'Syne',sans-serif;font-size:20px;">Salut ${u.full_name?.split(' ')[0] || ''} 🔥</h2>
    <p>Voici où en est ton empire cette semaine :</p>
    <ul style="list-style:none;padding:0;margin:20px 0;">
      <li style="background:rgba(255,255,255,0.03);padding:14px;border-radius:10px;margin-bottom:8px;"><strong style="color:#FF3D00;">${demarchesCount}</strong> démarche(s) mise(s) à jour</li>
      <li style="background:rgba(255,255,255,0.03);padding:14px;border-radius:10px;margin-bottom:8px;"><strong style="color:#FFB300;">${docsCount}</strong> document(s) ajouté(s) à ton ProofVault</li>
    </ul>
    ${upcoming.length > 0 ? `<h3 style="color:#fff;font-size:16px;margin-top:24px;">📅 Prochaines échéances</h3><ul style="padding-left:20px;color:#94A3B8;font-size:14px;">${upcomingList}</ul>` : ''}
    <div style="text-align:center;margin:32px 0 16px;">
      <a href="https://moksha.purama.dev/dashboard" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Ouvrir mon dashboard</a>
    </div>
    <p style="color:#64748B;font-size:11px;text-align:center;margin-top:32px;">© 2026 MOKSHA — SASU PURAMA</p>
  </div>
</body></html>`

    const ok = await sendEmail({
      to: u.email,
      subject: '📊 Ton récap MOKSHA de la semaine',
      html,
    })
    if (ok) sent++
  }

  return NextResponse.json({ ok: true, total_users: users?.length ?? 0, sent })
}
