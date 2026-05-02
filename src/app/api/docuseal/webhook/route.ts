import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhook } from '@/lib/docuseal'
import { deposerINPI, deposerAssociation, type WizardPayload } from '@/lib/pappers'
import { sendEmail } from '@/lib/resend'

export const runtime = 'nodejs'

/**
 * Webhook DocuSeal : notifié quand une signature est complétée / refusée.
 * Event types: submission.created, submission.completed, submission.declined, form.completed
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text()
    const signature = req.headers.get('x-docuseal-signature')
    const valid = await verifyWebhook(raw, signature)
    if (!valid) return NextResponse.json({ error: 'invalid signature' }, { status: 401 })

    const event = JSON.parse(raw) as {
      event_type?: string
      data?: {
        id?: number
        status?: string
        metadata?: Record<string, string>
        audit_log_url?: string
        combined_document_url?: string
      }
    }

    const eventType = event.event_type || ''
    const data = event.data || {}
    const demarcheId = data.metadata?.demarche_id
    const userId = data.metadata?.user_id
    if (!demarcheId || !userId) {
      return NextResponse.json({ ok: true, info: 'pas de metadata MOKSHA' })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'moksha' } }
    )

    if (eventType.includes('completed') || data.status === 'completed') {
      // Signature OK — on déclenche le dépôt INPI final
      const { data: demarche } = await sb
        .from('moksha_demarches')
        .select('*')
        .eq('id', demarcheId)
        .single()
      if (!demarche) return NextResponse.json({ ok: true })

      // Sauvegarde du document final signé dans ProofVault
      if (data.combined_document_url) {
        await sb.from('moksha_documents').insert({
          user_id: userId,
          structure_id: demarche.structure_id,
          demarche_id: demarche.id,
          nom: `Dossier_signe_${demarche.titre.replace(/\s+/g, '_')}.pdf`,
          type: 'autre',
          file_url: data.combined_document_url,
          mime_type: 'application/pdf',
          scanner_score: 'parfait',
          metadata: { audit_log_url: data.audit_log_url },
        })
      }

      // Dépôt INPI / préfecture
      const wizard = (demarche.wizard_data || {}) as WizardPayload
      const { data: docs } = await sb
        .from('moksha_documents')
        .select('nom, type, file_url')
        .eq('demarche_id', demarche.id)

      const result =
        demarche.type === 'association'
          ? await deposerAssociation(wizard)
          : await deposerINPI(wizard, docs || [])

      await sb
        .from('moksha_demarches')
        .update({
          statut: result.ok ? 'depose_inpi' : 'documents_generes',
          inpi_reference: result.reference ?? null,
          avancement: result.ok ? 80 : 60,
          date_depot: result.ok ? new Date().toISOString() : null,
          notes: result.ok ? null : result.error || 'Dépôt en attente',
        })
        .eq('id', demarche.id)

      if (demarche.structure_id && result.ok) {
        await sb.from('moksha_structures').update({ statut: 'depose' }).eq('id', demarche.structure_id)
      }

      const { data: profile } = await sb.from('moksha_profiles').select('email').eq('id', userId).single()
      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          subject: result.ok ? '✅ Dossier signé et déposé' : '⚠️ Dossier signé — dépôt en cours',
          html: `
<!DOCTYPE html>
<html><body style="font-family:'DM Sans',Arial,sans-serif;background:#070B18;color:#F8FAFC;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#0D1225;border-radius:16px;padding:40px;">
  <h1 style="color:#FF3D00;">${result.ok ? '🔥 Dossier déposé' : '⏳ Dossier en attente'}</h1>
  <p>Ta signature pour <strong>${demarche.titre}</strong> est enregistrée.</p>
  ${result.ok ? `<p>Référence INPI : <code>${result.reference}</code></p><p>Tu recevras ton Kbis sous 5 à 10 jours ouvrés.</p>` : `<p>Nous déposons ton dossier dans quelques instants. Tu recevras une confirmation rapidement.</p>`}
  <div style="text-align:center;margin:24px 0;">
    <a href="https://moksha.purama.dev/dashboard/demarches/${demarche.id}" style="display:inline-block;background:linear-gradient(135deg,#FF3D00,#FFB300);color:#070B18;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Voir mon dossier</a>
  </div>
</div></body></html>`,
        })
      }

      await sb.from('moksha_notifications').insert({
        user_id: userId,
        type: 'signature_ok',
        titre: result.ok ? 'Dossier signé et déposé' : 'Dossier signé — dépôt en cours',
        message: result.ok ? `Référence : ${result.reference}` : 'Traitement en cours',
        action_url: `/dashboard/demarches/${demarche.id}`,
      })

      return NextResponse.json({ ok: true, deposed: result.ok, reference: result.reference })
    }

    if (eventType.includes('declined')) {
      await sb
        .from('moksha_demarches')
        .update({ notes: 'Signature refusée par le signataire' })
        .eq('id', demarcheId)
      return NextResponse.json({ ok: true, declined: true })
    }

    return NextResponse.json({ ok: true, ignored: eventType })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
