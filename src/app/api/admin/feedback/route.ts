import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireSuperAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('moksha_user_feedback')
      .select('*, moksha_profiles!inner(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(100)

    const avg = data && data.length > 0
      ? (data.reduce((s, f) => s + f.rating, 0) / data.length).toFixed(1)
      : '0'

    return NextResponse.json({ feedbacks: data ?? [], avg, total: data?.length ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
