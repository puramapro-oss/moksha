import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDemarcheStatus } from '@/lib/pappers'
import { sendEmail, emailTemplates } from '@/lib/resend'
import { isAuthorizedCron } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * CRON moksha_check_inpi — toutes les 6h
 * Poll le statut des dossiers déposés à l'INPI via Pappers.
 * Met à jour la table moksha_demarches et notifie l'utilisateur si Kbis reçu.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )

  // On récupère les démarches en traitement ou déposées
  const { data: demarches, error } = await sb
    .from('moksha_demarches')
    .select('id, user_id, titre, inpi_reference, statut, structure_id')
    .in('statut', ['en_traitement', 'depose_inpi'])
    .not('inpi_reference', 'is', null)
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: { id: string; old: string; new: string }[] = []

  for (const d of demarches || []) {
    if (!d.inpi_reference) continue
    const status = await getDemarcheStatus(d.inpi_reference)
    if (!status.ok || !status.statut) continue

    if (status.statut !== d.statut) {
      const patch: Record<string, unknown> = { statut: status.statut, avancement: status.avancement ?? 50 }
      if (status.statut === 'accepte') {
        patch.date_acceptation = new Date().toISOString()
        patch.avancement = 100
        // Sauvegarder le Kbis dans ProofVault s'il est fourni
        if (status.kbis_url && d.structure_id) {
          await sb
            .from('moksha_structures')
            .update({ statut: 'accepte', kbis_url: status.kbis_url })
            .eq('id', d.structure_id)
          await sb.from('moksha_documents').insert({
            user_id: d.user_id,
            structure_id: d.structure_id,
            demarche_id: d.id,
            nom: `Kbis_${d.titre.replace(/\s+/g, '_')}.pdf`,
            type: 'kbis',
            file_url: status.kbis_url,
            mime_type: 'application/pdf',
            scanner_score: 'parfait',
          })
        }
        // Email
        const { data: profile } = await sb.from('moksha_profiles').select('email').eq('id', d.user_id).single()
        if (profile?.email) {
          await sendEmail({
            to: profile.email,
            subject: `🎉 Ton Kbis est arrivé — ${d.titre}`,
            html: emailTemplates.kbis_recu(d.titre),
          })
        }
      } else if (status.statut === 'refuse' || status.statut === 'regularisation') {
        patch.notes = status.motif || null
      }

      await sb.from('moksha_demarches').update(patch).eq('id', d.id)
      await sb.from('moksha_notifications').insert({
        user_id: d.user_id,
        type: 'demarche_update',
        titre: `Mise à jour : ${d.titre}`,
        message: `Statut : ${status.statut}`,
        action_url: `/dashboard/demarches/${d.id}`,
      })
      results.push({ id: d.id, old: d.statut, new: status.statut })
    }
  }

  return NextResponse.json({ ok: true, checked: demarches?.length ?? 0, updated: results.length, results })
}
