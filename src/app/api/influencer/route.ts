import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// GET — profil influenceur de l'utilisateur connecté + stats
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: profile } = await supabase
      .from('moksha_influencer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) return NextResponse.json({ profile: null })

    // Stats clicks + conversions
    const [clicksRes, convRes] = await Promise.all([
      supabase
        .from('moksha_influencer_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('influencer_slug', profile.slug),
      supabase
        .from('moksha_influencer_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('influencer_slug', profile.slug)
        .not('converted_user_id', 'is', null),
    ])

    return NextResponse.json({
      profile,
      stats: {
        clicks: clicksRes.count ?? 0,
        conversions: convRes.count ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST — devenir influenceur (crée le profil)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const { slug: rawSlug, bio, social_links } = body

    if (!rawSlug || typeof rawSlug !== 'string' || rawSlug.length < 3) {
      return NextResponse.json({ error: 'Slug requis (3 caractères min)' }, { status: 400 })
    }

    const slug = slugify(rawSlug)
    if (slug.length < 3) {
      return NextResponse.json({ error: 'Slug invalide après nettoyage' }, { status: 400 })
    }

    // Unicité du slug
    const { data: existing } = await supabase
      .from('moksha_influencer_profiles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ce pseudo est déjà pris' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('moksha_influencer_profiles')
      .insert({
        user_id: user.id,
        slug,
        bio: bio?.slice(0, 500) ?? null,
        social_links: social_links ?? {},
        tier: 'bronze',
        approved: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur création profil' }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
