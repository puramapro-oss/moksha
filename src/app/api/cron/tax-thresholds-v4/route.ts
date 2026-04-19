import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { computeThresholdAlert } from '@/lib/tax'
import { sendEmail } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * CRON quotidien V4 — notification seuils fiscaux 305€/1500€/2500€/3000€/36800€.
 * Envoie 1 email + flag threshold_*_alerted=true pour éviter doublons.
 * Distinct de /api/cron/fiscal-thresholds (V7 legacy sur moksha_fiscal_notifications).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } },
  )

  const { data: wallets } = await sb
    .from('moksha_user_wallets')
    .select('user_id, yearly_earned_eur')
    .gt('yearly_earned_eur', 1000)

  let alertsSent = 0
  const errors: string[] = []

  for (const w of wallets ?? []) {
    const { data: tax } = await sb
      .from('moksha_user_tax_profiles')
      .select('profile_type, threshold_305_alerted, threshold_bnc_alerted, threshold_tva_alerted')
      .eq('user_id', w.user_id)
      .maybeSingle()

    if (!tax) continue

    const alert = computeThresholdAlert({
      yearlyEur: Number(w.yearly_earned_eur),
      currentProfile: tax.profile_type,
      alerted: {
        threshold_305: tax.threshold_305_alerted ?? false,
        threshold_bnc: tax.threshold_bnc_alerted ?? false,
        threshold_tva: tax.threshold_tva_alerted ?? false,
      },
    })

    if (!alert) continue

    const { data: profile } = await sb
      .from('moksha_profiles')
      .select('email, full_name')
      .eq('id', w.user_id)
      .maybeSingle<{ email: string | null; full_name: string | null }>()

    if (profile?.email) {
      const subject =
        alert.level === 'critical'
          ? '⚠️ Seuil 3 000€ atteint — déclaration requise'
          : alert.level === 'warning'
          ? '💡 Tu approches du seuil 3 000€'
          : 'Info fiscale — Purama'
      try {
        await sendEmail({
          to: profile.email,
          subject,
          html: `
            <div style="font-family:DM Sans,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h1 style="color:#FF6B35;margin:0 0 12px">Information fiscale</h1>
              <p style="color:#333;line-height:1.6">${alert.message}</p>
              <p style="color:#666;line-height:1.6;font-size:14px">${alert.action}</p>
              <a href="https://moksha.purama.dev/dashboard/fiscalite" style="display:inline-block;margin-top:16px;padding:12px 20px;background:linear-gradient(135deg,#FF6B35,#FFD700);color:#070B18;border-radius:12px;font-weight:700;text-decoration:none">Voir mon dashboard fiscal</a>
              <p style="color:#999;font-size:11px;margin-top:24px">Purama est tiers déclarant (mandat), pas expert-comptable.</p>
            </div>
          `,
        })
        alertsSent++
      } catch (e) {
        errors.push(`${w.user_id}: ${e instanceof Error ? e.message : 'email'}`)
      }
    }

    // Flag pour éviter doublons (1× par palier)
    const updates: Record<string, boolean> = {}
    if (alert.threshold === 1500 || alert.threshold === 2500) updates.threshold_305_alerted = true
    if (alert.threshold === 3000) updates.threshold_bnc_alerted = true
    if (alert.threshold >= 36800) updates.threshold_tva_alerted = true

    if (Object.keys(updates).length > 0) {
      await sb.from('moksha_user_tax_profiles').update(updates).eq('user_id', w.user_id)
    }
  }

  return NextResponse.json({
    ok: true,
    alerts_sent: alertsSent,
    users_scanned: wallets?.length ?? 0,
    errors: errors.slice(0, 10),
  })
}
