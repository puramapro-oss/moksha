import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const WELCOME_BONUS = 100

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Check if already awarded (look for 'inscription' transaction)
    const { data: existing } = await supabase
      .from('moksha_point_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'inscription')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Bonus déjà réclamé', already: true }, { status: 400 })
    }

    await supabase.from('moksha_point_transactions').insert({
      user_id: user.id,
      amount: WELCOME_BONUS,
      type: 'inscription',
      description: 'Bienvenue chez toi — bonus de départ',
    })
    await supabase.rpc('moksha_add_points', { p_user_id: user.id, p_amount: WELCOME_BONUS })

    return NextResponse.json({ awarded: WELCOME_BONUS })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET — vérifie si l'utilisateur a déjà reçu le bonus
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data } = await supabase
      .from('moksha_point_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'inscription')
      .limit(1)

    return NextResponse.json({ received: !!(data && data.length > 0) })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
