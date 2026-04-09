import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier ownership via la conversation
  const { data: conv } = await supabase
    .from('moksha_jurisia_conversations')
    .select('id, titre, user_id')
    .eq('id', id)
    .single()
  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  const { data: messages } = await supabase
    .from('moksha_jurisia_messages')
    .select('id, role, content, sources, confiance, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ conversation: conv, messages: messages || [] })
}
