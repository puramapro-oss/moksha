import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireSuperAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('moksha_contact_messages')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100)

    return NextResponse.json({ messages: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
