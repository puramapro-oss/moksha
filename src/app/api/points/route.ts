import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const [balanceRes, txRes, rankRes] = await Promise.all([
      supabase
        .from('moksha_point_balances')
        .select('balance, lifetime_earned')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('moksha_point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .rpc('moksha_get_points_rank', { p_user_id: user.id }),
    ])

    return NextResponse.json({
      balance: balanceRes.data?.balance ?? 0,
      lifetime_earned: balanceRes.data?.lifetime_earned ?? 0,
      rank: rankRes.data ?? null,
      transactions: txRes.data ?? [],
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
