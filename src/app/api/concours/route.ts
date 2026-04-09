import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const [leaderboard, tickets, pastResults] = await Promise.all([
      supabase
        .from('moksha_contest_leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10),
      supabase
        .from('moksha_lottery_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('draw_id', null),
      supabase
        .from('moksha_contest_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    return NextResponse.json({
      leaderboard: leaderboard.data ?? [],
      tickets: tickets.count ?? 0,
      pastResults: pastResults.data ?? [],
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
