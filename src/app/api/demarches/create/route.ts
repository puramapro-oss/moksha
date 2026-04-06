import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const type = body?.type === 'association' ? 'association' : 'entreprise'
    const wizard = body?.wizard_data || {}

    // Creation de la structure
    const { data: structure, error: errStruct } = await supabase
      .from('moksha_structures')
      .insert({
        user_id: user.id,
        type,
        forme: wizard.forme ?? null,
        denomination: wizard.denomination ?? wizard.nom ?? null,
        nom_commercial: wizard.nom_commercial ?? null,
        activite: wizard.activite ?? wizard.objet ?? null,
        code_ape: wizard.code_ape ?? null,
        adresse_siege: wizard.adresse ?? null,
        capital_social: wizard.capital ?? null,
        statut: 'brouillon',
        metadata: wizard,
      })
      .select()
      .single()

    if (errStruct || !structure) {
      return NextResponse.json({ error: errStruct?.message || 'Échec structure' }, { status: 500 })
    }

    // Creation de la démarche
    const { data: demarche, error: errDem } = await supabase
      .from('moksha_demarches')
      .insert({
        user_id: user.id,
        structure_id: structure.id,
        type: type === 'association' ? 'association' : 'creation',
        titre: `Création ${wizard.denomination || wizard.nom || 'structure'}`,
        mode: wizard.mode || 'standard',
        statut: 'brouillon',
        wizard_data: wizard,
        avancement: 10,
      })
      .select()
      .single()

    if (errDem || !demarche) {
      return NextResponse.json({ error: errDem?.message || 'Échec démarche' }, { status: 500 })
    }

    return NextResponse.json({ id: demarche.id, structure_id: structure.id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
