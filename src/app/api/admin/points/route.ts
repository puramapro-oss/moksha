import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireSuperAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  try {
    const supabase = await createServerSupabaseClient()
    const [balances, recentTx] = await Promise.all([
      supabase
        .from('moksha_point_balances')
        .select('*, moksha_profiles!inner(email, full_name)')
        .order('lifetime_earned', { ascending: false })
        .limit(50),
      supabase
        .from('moksha_point_transactions')
        .select('*, moksha_profiles!inner(email)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const totalPoints = (balances.data ?? []).reduce((s, b) => s + (b.balance ?? 0), 0)

    return NextResponse.json({
      balances: balances.data ?? [],
      recentTransactions: recentTx.data ?? [],
      totalPoints,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
