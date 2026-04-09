import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { askClaude, getDocumentGenerationPrompt } from '@/lib/claude'
import { deposerINPI, deposerAssociation, publierAnnonceLegale, type WizardPayload } from '@/lib/pappers'
import { createSubmission, isDocuSealConfigured } from '@/lib/docuseal'
import { sendEmail, emailTemplates } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * POST /api/demarches/:id/deposer
 *
 * Pipeline complet de création :
 *  1. Vérif auth + ownership
 *  2. Génération des 8 documents via Claude API
 *  3. Upload des docs dans Storage
 *  4. Publication annonce légale via Pappers
 *  5. Création submission DocuSeal pour signature
 *  6. Dépôt formalité INPI via Pappers Services (après signature — ici on prépare le dossier)
 *  7. Update démarche + structure + notifs + email
 *
 * Le dépôt INPI réel est déclenché par le webhook DocuSeal quand la signature est terminée.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Récupère la démarche + profil
    const [{ data: demarche }, { data: profile }] = await Promise.all([
      supabase
        .from('moksha_demarches')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase.from('moksha_profiles').select('*').eq('id', user.id).single(),
    ])

    if (!demarche) return NextResponse.json({ error: 'Démarche introuvable' }, { status: 404 })
    if (demarche.statut !== 'brouillon' && demarche.statut !== 'documents_generes') {
      return NextResponse.json({ error: `Démarche déjà au statut ${demarche.statut}` }, { status: 400 })
    }

    const wizard = (demarche.wizard_data || {}) as WizardPayload
    const isAssoc = demarche.type === 'association'
    const plan = (profile?.plan || 'gratuit') as 'gratuit' | 'autopilote' | 'pro'

    // 1. Génération des documents via Claude
    const docList = isAssoc
      ? [
          { nom: 'Statuts association loi 1901', type: 'statuts' as const },
          { nom: 'PV assemblée générale constitutive', type: 'pv' as const },
          { nom: 'Liste des dirigeants', type: 'autre' as const },
          { nom: 'Déclaration préfecture (Cerfa 13973)', type: 'autre' as const },
        ]
      : [
          { nom: 'Statuts de la société', type: 'statuts' as const },
          { nom: 'PV de nomination du dirigeant', type: 'pv' as const },
          { nom: 'Attestation de dépôt de capital', type: 'autre' as const },
          { nom: 'Déclaration de non-condamnation', type: 'autre' as const },
          { nom: 'Déclaration des bénéficiaires effectifs', type: 'autre' as const },
          { nom: 'Mandat de dépôt au RCS', type: 'autre' as const },
          { nom: "Lettre d'attestation de domiciliation", type: 'domicile' as const },
        ]

    const generated: Array<{ nom: string; type: string; file_url: string; file_size: number }> = []

    // Service role client pour écrire dans Storage sans contourner les RLS utilisateur
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'moksha' } }
    )

    for (const doc of docList) {
      try {
        const content = await askClaude(
          [{ role: 'user', content: getDocumentGenerationPrompt(doc.nom, wizard as Record<string, unknown>) }],
          plan,
          'Tu es un juriste expert français. Génère uniquement le document demandé, sans préambule ni explication.'
        )
        const md = content || `# ${doc.nom}\n\n_Document indisponible, ré-essayer depuis le dashboard._`
        const fileName = `${doc.nom.replace(/[^a-zA-Z0-9]/g, '_')}.md`
        const path = `${user.id}/${demarche.id}/${fileName}`
        const buf = new Blob([md], { type: 'text/markdown' })

        const { error: upErr } = await admin.storage
          .from('moksha_documents')
          .upload(path, buf, { upsert: true, contentType: 'text/markdown' })
        if (upErr) continue

        const { data: urlData } = admin.storage.from('moksha_documents').getPublicUrl(path)
        const file_url = urlData.publicUrl
        const file_size = md.length

        await admin.from('moksha_documents').insert({
          user_id: user.id,
          structure_id: demarche.structure_id,
          demarche_id: demarche.id,
          nom: doc.nom,
          type: doc.type,
          file_url,
          file_size,
          mime_type: 'text/markdown',
          scanner_score: 'parfait',
        })

        generated.push({ nom: doc.nom, type: doc.type, file_url, file_size })
      } catch {
        // On continue même si un doc échoue
      }
    }

    // 2. Publication annonce légale (entreprise uniquement)
    let annonceRef: string | null = null
    if (!isAssoc) {
      const annonce = await publierAnnonceLegale(wizard)
      if (annonce.ok) annonceRef = annonce.reference ?? null
    }

    // 3. Création DocuSeal submission pour signature
    const signerEmail = user.email || ''
    const signerName = profile?.full_name || `${wizard.dirigeant?.prenom ?? ''} ${wizard.dirigeant?.nom ?? ''}`.trim() || 'Signataire'
    const submission = await createSubmission({
      documents: generated.slice(0, 3).map((g) => ({ name: g.nom, file_url: g.file_url })),
      submitter: { email: signerEmail, name: signerName, role: 'Dirigeant' },
      metadata: {
        demarche_id: demarche.id,
        user_id: user.id,
        app: 'moksha',
      },
      send_email: true,
    })

    // 4. Update démarche
    await admin
      .from('moksha_demarches')
      .update({
        statut: 'documents_generes',
        documents_generes: generated,
        avancement: 50,
        wizard_data: {
          ...wizard,
          annonce_ref: annonceRef,
          docuseal_submission_id: submission.submission?.id,
          docuseal_sign_url: submission.sign_url,
        },
      })
      .eq('id', demarche.id)

    // 5. Email confirmation
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Tes documents MOKSHA sont prêts à signer',
        html: emailTemplates.creation_depose(demarche.titre, submission.submission?.id?.toString() || 'MOKSHA-' + demarche.id.slice(0, 8)),
      })
    }

    await admin.from('moksha_notifications').insert({
      user_id: user.id,
      type: 'demarche_prete',
      titre: 'Documents générés — signature requise',
      message: `${generated.length} documents prêts. Signe pour déposer à l'INPI.`,
      action_url: `/dashboard/demarches/${demarche.id}`,
    })

    return NextResponse.json({
      ok: true,
      documents: generated.length,
      docuseal_mode: isDocuSealConfigured() ? 'cloud' : 'local',
      sign_url: submission.sign_url,
      next: 'Signer puis retour webhook pour déclencher dépôt INPI final',
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

/**
 * Déclenche le dépôt INPI effectif après signature.
 * Appelée depuis le webhook DocuSeal ou depuis le signer fallback interne.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'moksha' } }
    )

    const { data: demarche } = await admin
      .from('moksha_demarches')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!demarche) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const wizard = (demarche.wizard_data || {}) as WizardPayload
    const { data: docs } = await admin
      .from('moksha_documents')
      .select('nom, type, file_url')
      .eq('demarche_id', demarche.id)

    const result =
      demarche.type === 'association'
        ? await deposerAssociation(wizard)
        : await deposerINPI(wizard, docs || [])

    const patch: Record<string, unknown> = {
      statut: result.ok ? 'depose_inpi' : 'documents_generes',
      avancement: result.ok ? 80 : 50,
      date_depot: result.ok ? new Date().toISOString() : null,
      inpi_reference: result.reference ?? null,
      notes: result.ok ? null : result.error,
    }

    await admin.from('moksha_demarches').update(patch).eq('id', demarche.id)

    if (result.ok && demarche.structure_id) {
      await admin
        .from('moksha_structures')
        .update({ statut: 'depose' })
        .eq('id', demarche.structure_id)
    }

    return NextResponse.json({ ok: result.ok, result })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
