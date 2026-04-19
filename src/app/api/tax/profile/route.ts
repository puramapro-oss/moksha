import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { TAX_PROFILES, type TaxProfileType, validateSiret, extractSiren } from '@/lib/tax'

export const runtime = 'nodejs'

const SetupSchema = z.object({
  profile_type: z.enum(['particulier_occasionnel', 'particulier_bnc', 'autoentrepreneur', 'entreprise']),
  siret: z.string().optional(),
  company_name: z.string().max(200).optional(),
  legal_form: z.string().max(50).optional(),
  activity_type: z.string().max(200).optional(),
  tva_franchise: z.boolean().optional(),
})

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const svc = createServiceClient()
    const { data: profile } = await svc
      .from('moksha_user_tax_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: wallet } = await svc
      .from('moksha_user_wallets')
      .select('yearly_earned_eur, lifetime_earned_eur')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      profile,
      wallet,
      definitions: TAX_PROFILES,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur profil fiscal'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = SetupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
    }
    const data = parsed.data

    let siren: string | null = null
    if (data.siret) {
      if (!validateSiret(data.siret)) {
        return NextResponse.json({ error: 'SIRET invalide (14 chiffres, checksum Luhn)' }, { status: 400 })
      }
      siren = extractSiren(data.siret)
    }

    // AE/entreprise requièrent un SIRET.
    const requiresSiret: TaxProfileType[] = ['autoentrepreneur', 'entreprise']
    if (requiresSiret.includes(data.profile_type) && !data.siret) {
      return NextResponse.json({ error: 'SIRET requis pour ce profil' }, { status: 400 })
    }

    const svc = createServiceClient()
    const { error } = await svc
      .from('moksha_user_tax_profiles')
      .upsert({
        user_id: user.id,
        profile_type: data.profile_type,
        siret: data.siret ?? null,
        siren,
        company_name: data.company_name ?? null,
        legal_form: data.legal_form ?? null,
        activity_type: data.activity_type ?? null,
        tva_franchise: data.tva_franchise ?? true,
        onboarded_at: new Date().toISOString(),
      })
    if (error) {
      return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, profile_type: data.profile_type })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur setup'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
