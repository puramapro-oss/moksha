/**
 * GET /api/legal/my-data — export complet des données personnelles au format JSON
 * (droit à la portabilité, art. 20 RGPD ; page « Ma mémoire »). Lit RÉELLEMENT les tables
 * métier MOKSHA (pas un stub) — cf PIEGES.md §16 "l'export réussit mais omet la donnée
 * la plus sensible" : moksha_jurisia_messages (historique de conversation juridique) est
 * la donnée la plus sensible de cette app, jointe explicitement via les conversations.
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const EXTRA_TABLES: Array<{ table: string; userIdColumn: string }> = [
  { table: 'moksha_demarches', userIdColumn: 'user_id' },
  { table: 'moksha_structures', userIdColumn: 'user_id' },
  { table: 'moksha_documents', userIdColumn: 'user_id' },
  { table: 'moksha_jurisia_conversations', userIdColumn: 'user_id' },
  { table: 'moksha_nama_messages', userIdColumn: 'user_id' },
  { table: 'moksha_referrals', userIdColumn: 'referrer_id' },
  { table: 'moksha_user_wallets', userIdColumn: 'user_id' },
  { table: 'moksha_wallet_transactions', userIdColumn: 'user_id' },
  { table: 'moksha_point_balances', userIdColumn: 'user_id' },
  { table: 'moksha_point_transactions', userIdColumn: 'user_id' },
  { table: 'moksha_gratitude_entries', userIdColumn: 'user_id' },
  { table: 'moksha_intentions', userIdColumn: 'user_id' },
  { table: 'moksha_breath_sessions', userIdColumn: 'user_id' },
  { table: 'moksha_notifications', userIdColumn: 'user_id' },
  { table: 'moksha_dossiers_financement', userIdColumn: 'user_id' },
  { table: 'moksha_karma_tickets', userIdColumn: 'user_id' },
  { table: 'moksha_lottery_tickets', userIdColumn: 'user_id' },
  { table: 'moksha_user_tax_profiles', userIdColumn: 'user_id' },
  { table: 'moksha_tax_declarations', userIdColumn: 'user_id' },
  { table: 'moksha_social_shares', userIdColumn: 'user_id' },
  { table: 'moksha_user_feedback', userIdColumn: 'user_id' },
  { table: 'moksha_subscriptions', userIdColumn: 'user_id' },
  { table: 'moksha_retractions', userIdColumn: 'user_id' },
  { table: 'moksha_rappels', userIdColumn: 'user_id' },
]

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 })

  const [{ data: profile }, { data: acceptances }, { data: cookieConsent }, { data: conversations }] = await Promise.all([
    supabase.from('moksha_profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('legal_acceptances').select('doc_type, version, accepted_at').eq('user_id', user.id),
    supabase.from('cookie_consents').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('moksha_jurisia_conversations').select('id').eq('user_id', user.id),
  ])

  const extra: Record<string, unknown> = {}
  for (const { table, userIdColumn } of EXTRA_TABLES) {
    const { data } = await supabase.from(table).select('*').eq(userIdColumn, user.id)
    extra[table] = data ?? []
  }

  const conversationIds = (conversations ?? []).map((c: { id: string }) => c.id)
  let jurisiaMessages: unknown[] = []
  if (conversationIds.length > 0) {
    const { data } = await supabase.from('moksha_jurisia_messages').select('*').in('conversation_id', conversationIds)
    jurisiaMessages = data ?? []
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    compte: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile ?? null,
    acceptationsLegales: acceptances ?? [],
    consentementCookies: cookieConsent ?? null,
    moksha_jurisia_messages: jurisiaMessages,
    ...extra,
  }

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="mes-donnees.json"',
    },
  })
}
