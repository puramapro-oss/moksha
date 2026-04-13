import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { APP_SCHEMA } from '@/lib/constants'

function createAuthClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: APP_SCHEMA },
      cookies: {
        getAll: async () => (await cookieStore).getAll(),
        setAll: async (cookiesToSet) => {
          const store = await cookieStore
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options))
        },
      },
    },
  )
}

// GET — liste les dossiers de l'utilisateur connecté
export async function GET() {
  try {
    const supabase = createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data, error } = await supabase
      .from('moksha_dossiers_financement')
      .select('*, moksha_aides(nom, montant_max, badge, url_officielle)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Erreur chargement dossiers' }, { status: 500 })

    return NextResponse.json({ dossiers: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST — crée un dossier de financement
export async function POST(req: NextRequest) {
  try {
    const supabase = createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { aide_id, profil, situation, handicap } = body

    if (!aide_id || !profil || !situation) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('moksha_dossiers_financement')
      .insert({
        user_id: user.id,
        aide_id,
        profil,
        situation,
        handicap: handicap ?? false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Erreur création dossier' }, { status: 500 })

    return NextResponse.json({ dossier: data })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — met à jour le statut d'un dossier
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { id, statut } = body

    if (!id || !statut) {
      return NextResponse.json({ error: 'ID et statut requis' }, { status: 400 })
    }

    const validStatuts = ['en_cours', 'accepte', 'refuse', 'renouveler']
    if (!validStatuts.includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('moksha_dossiers_financement')
      .update({ statut })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })

    return NextResponse.json({ dossier: data })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
