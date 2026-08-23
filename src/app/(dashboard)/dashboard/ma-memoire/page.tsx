import { createServerSupabaseClient } from '@/lib/supabase-server'
import MaMemoirePage, { type LegalAcceptanceRow } from '@/lib/legal/components/MaMemoirePage'

export const metadata = { title: 'Ma mémoire — MOKSHA' }
export const dynamic = 'force-dynamic'

export default async function MaMemoire() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-white/60">Connecte-toi pour voir tes données.</p>
      </main>
    )
  }

  const [{ data: acceptances }, { data: deletion }] = await Promise.all([
    supabase.from('legal_acceptances').select('doc_type, version, accepted_at').eq('user_id', user.id),
    supabase
      .from('account_deletion_requests')
      .select('scheduled_for')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .maybeSingle(),
  ])

  const acceptations: LegalAcceptanceRow[] = (acceptances ?? []).map((a) => ({
    docType: a.doc_type,
    version: a.version,
    acceptedAt: a.accepted_at,
  }))

  return (
    <MaMemoirePage
      appName="MOKSHA"
      acceptations={acceptations}
      deletionScheduledFor={deletion?.scheduled_for ?? null}
    />
  )
}
