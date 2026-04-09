import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, emailTemplates } from '@/lib/resend'

export const runtime = 'nodejs'

/**
 * Webhook Pappers Services — appelé quand le statut d'une formalité change.
 * Payload attendu : { reference, statut, avancement?, motif?, kbis_url?, documents? }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as {
      reference?: string
      statut?: string
      avancement?: number
      motif?: string
      kbis_url?: string
      documents?: Array<{ type: string; url: string }>
    }

    if (!payload.reference) {
      return NextResponse.json({ error: 'reference manquante' }, { status: 400 })
    }

    // Auth facultative : token dans header
    const signature = req.headers.get('x-pappers-signature') || req.headers.get('x-api-token')
    if (process.env.PAPPERS_WEBHOOK_SECRET && signature !== process.env.PAPPERS_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'moksha' } }
    )

    const { data: demarche } = await sb
      .from('moksha_demarches')
      .select('id, user_id, titre, structure_id, statut')
      .eq('inpi_reference', payload.reference)
      .single()

    if (!demarche) {
      return NextResponse.json({ ok: true, info: 'démarche introuvable (peut être test)' })
    }

    const mapStatut: Record<string, string> = {
      en_cours: 'en_traitement',
      processing: 'en_traitement',
      deposed: 'depose_inpi',
      soumis: 'depose_inpi',
      accepted: 'accepte',
      validee: 'accepte',
      rejected: 'refuse',
      refusee: 'refuse',
      correction: 'regularisation',
      regularisation: 'regularisation',
    }
    const newStatut = mapStatut[payload.statut || ''] || 'en_traitement'

    const patch: Record<string, unknown> = {
      statut: newStatut,
      avancement: payload.avancement ?? (newStatut === 'accepte' ? 100 : 75),
      notes: payload.motif || null,
    }
    if (newStatut === 'accepte') patch.date_acceptation = new Date().toISOString()

    await sb.from('moksha_demarches').update(patch).eq('id', demarche.id)

    if (newStatut === 'accepte' && demarche.structure_id) {
      await sb
        .from('moksha_structures')
        .update({ statut: 'accepte', kbis_url: payload.kbis_url || null })
        .eq('id', demarche.structure_id)

      if (payload.kbis_url) {
        await sb.from('moksha_documents').insert({
          user_id: demarche.user_id,
          structure_id: demarche.structure_id,
          demarche_id: demarche.id,
          nom: `Kbis_${demarche.titre.replace(/\s+/g, '_')}.pdf`,
          type: 'kbis',
          file_url: payload.kbis_url,
          mime_type: 'application/pdf',
          scanner_score: 'parfait',
        })
      }

      // Email Kbis
      const { data: profile } = await sb
        .from('moksha_profiles')
        .select('email')
        .eq('id', demarche.user_id)
        .single()
      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          subject: `🎉 Ton Kbis est arrivé — ${demarche.titre}`,
          html: emailTemplates.kbis_recu(demarche.titre),
        })
      }
    }

    await sb.from('moksha_notifications').insert({
      user_id: demarche.user_id,
      type: 'demarche_update',
      titre: `Mise à jour : ${demarche.titre}`,
      message: `Statut : ${newStatut}${payload.motif ? ` — ${payload.motif}` : ''}`,
      action_url: `/dashboard/demarches/${demarche.id}`,
    })

    return NextResponse.json({ ok: true, demarche_id: demarche.id, new_statut: newStatut })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
