import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('moksha_notifications')
    .select('id, type, titre, message, lu, action_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unread = (data || []).filter((n) => !n.lu).length
  return NextResponse.json({ notifications: data || [], unread })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id, all } = (await req.json()) as { id?: string; all?: boolean }
  if (all) {
    await supabase.from('moksha_notifications').update({ lu: true }).eq('user_id', user.id).eq('lu', false)
    return NextResponse.json({ ok: true })
  }
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
  await supabase.from('moksha_notifications').update({ lu: true }).eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
