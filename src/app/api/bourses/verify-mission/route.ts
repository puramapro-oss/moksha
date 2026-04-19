import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getMissionBySlug } from '@/lib/bourses'

export const runtime = 'nodejs'

const VerifySchema = z.object({
  mission_slug: z.string().min(1),
  proof_url: z.string().url().optional(),
  proof_text: z.string().max(2000).optional(),
})

/**
 * Incrémente missions_completees après validation preuve.
 * Les missions avec verification=peer_validation|manual_admin sont mises en attente (flag proof_documents).
 * Les missions url_proof|geo_photo sont validées auto si URL 200.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = VerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
    }

    const mission = getMissionBySlug(parsed.data.mission_slug)
    if (!mission) return NextResponse.json({ error: 'Mission inconnue' }, { status: 404 })

    const svc = createServiceClient()
    const { data: bourse } = await svc
      .from('moksha_bourses_inclusion')
      .select('missions_completees, versee, proof_documents')
      .eq('user_id', user.id)
      .maybeSingle<{ missions_completees: number; versee: boolean; proof_documents: unknown[] }>()

    if (!bourse) return NextResponse.json({ error: 'Bourse non éligible' }, { status: 403 })
    if (bourse.versee) return NextResponse.json({ error: 'Bourse déjà versée' }, { status: 400 })

    const existingProofs = Array.isArray(bourse.proof_documents) ? bourse.proof_documents : []

    // Anti-double-validation par mission
    const alreadySubmitted = existingProofs.some((p: unknown) => {
      const row = p as { slug?: string }
      return row?.slug === mission.slug
    })
    if (alreadySubmitted) {
      return NextResponse.json({ error: 'Mission déjà soumise' }, { status: 400 })
    }

    // Auto-validation si url_proof
    let autoValidated = false
    if (mission.verification === 'url_proof' && parsed.data.proof_url) {
      try {
        const res = await fetch(parsed.data.proof_url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
        if (res.ok) autoValidated = true
      } catch {
        // URL inaccessible → manual review
      }
    }

    const newProofs = [
      ...existingProofs,
      {
        slug: mission.slug,
        title: mission.title,
        proof_url: parsed.data.proof_url ?? null,
        proof_text: parsed.data.proof_text ?? null,
        submitted_at: new Date().toISOString(),
        status: autoValidated ? 'validated' : 'pending',
      },
    ]

    const newCount = autoValidated ? (bourse.missions_completees ?? 0) + 1 : bourse.missions_completees ?? 0

    await svc
      .from('moksha_bourses_inclusion')
      .update({
        proof_documents: newProofs,
        missions_completees: newCount,
      })
      .eq('user_id', user.id)

    return NextResponse.json({
      ok: true,
      auto_validated: autoValidated,
      missions_completees: newCount,
      status: autoValidated ? 'validated' : 'pending_review',
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
