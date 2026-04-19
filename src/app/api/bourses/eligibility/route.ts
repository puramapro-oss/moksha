import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { computeBourseMontant, PROFIL_LABELS, type ProfilSocial } from '@/lib/bourses'

export const runtime = 'nodejs'

const EligibilitySchema = z.object({
  profil_social: z.array(
    z.enum(['caf', 'rural', 'jeune', 'senior', 'demandeur_emploi', 'etudiant', 'handicap']),
  ).min(1),
})

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const svc = createServiceClient()
    const { data } = await svc
      .from('moksha_bourses_inclusion')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      bourse: data,
      profils_labels: PROFIL_LABELS,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = EligibilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
    }
    const profils = parsed.data.profil_social as ProfilSocial[]
    const montant = computeBourseMontant(profils)

    const svc = createServiceClient()
    const { error } = await svc.from('moksha_bourses_inclusion').upsert({
      user_id: user.id,
      profil_social: profils,
      montant_eur: montant,
      eligible_at: new Date().toISOString(),
      financement_source: 'pending',
      missions_requises: 5,
    })
    if (error) return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 })

    return NextResponse.json({ ok: true, montant_eur: montant, missions_requises: 5 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
