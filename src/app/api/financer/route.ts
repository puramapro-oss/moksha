import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// GET /api/financer?profil=particulier&situation=salarie&handicap=false
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const profil = searchParams.get('profil')
    const situation = searchParams.get('situation')
    const handicap = searchParams.get('handicap') === 'true'

    const supabase = createServiceClient()

    let query = supabase
      .from('moksha_aides')
      .select('*')
      .eq('active', true)
      .order('montant_max', { ascending: false })

    const { data: aides, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erreur lors du chargement des aides' }, { status: 500 })
    }

    // Filtrage côté serveur si profil/situation fournis
    let filtered = aides ?? []
    if (profil) {
      filtered = filtered.filter((a) => {
        if (!a.profil_eligible?.includes(profil)) return false
        if (a.handicap_only && !handicap) return false
        if (profil === 'association' || profil === 'etudiant') return true
        if (situation) return a.situation_eligible?.includes(situation)
        return true
      })
    }

    const cumul = filtered.reduce((sum, a) => sum + (a.montant_max ?? 0), 0)

    return NextResponse.json({ aides: filtered, cumul, total: filtered.length })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
