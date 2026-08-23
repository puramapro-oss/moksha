/**
 * CRON — suppression effective des comptes (RGPD art. 17). Quotidien, 03:00 UTC.
 *
 * Lit account_deletion_requests dont scheduled_for <= now() et status='scheduled'.
 * Pour chaque ligne : marque 'executing' -> auth.admin.deleteUser(user_id) (purge auth.users
 * + CASCADE sur les tables FK, dont legal_acceptances/cookie_consents) -> marque 'completed'.
 * Échec -> reste 'executing', pas de retry auto (investigation manuelle, PIEGES.md §16 :
 * jamais renvoyer {success:true} sans DELETE réel).
 *
 * createServiceClient() (src/lib/supabase.ts) est le seul client service_role de MOKSHA —
 * il couvre à la fois .auth.admin.* et les requêtes de table (pattern pashu, cf packages/legal/README.md).
 */
import { type NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/cron-auth'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DeletionRow {
  id: string
  user_id: string
  scheduled_for: string
}

export async function GET(req: NextRequest) {
  return run(req)
}
export async function POST(req: NextRequest) {
  return run(req)
}

async function run(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const startedAt = Date.now()
  const now = new Date().toISOString()

  const { data: requests, error: rErr } = await service
    .from('account_deletion_requests')
    .select('id, user_id, scheduled_for')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .limit(100)
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  const list = (requests ?? []) as DeletionRow[]
  if (list.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, note: 'no deletion request due' })
  }

  const results: Array<{ id: string; user_id: string; ok: boolean; error?: string }> = []

  for (const deletion of list) {
    await service.from('account_deletion_requests').update({ status: 'executing' }).eq('id', deletion.id)

    try {
      const { error: authErr } = await service.auth.admin.deleteUser(deletion.user_id)
      if (authErr) throw authErr

      await service
        .from('account_deletion_requests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', deletion.id)

      results.push({ id: deletion.id, user_id: deletion.user_id, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ id: deletion.id, user_id: deletion.user_id, ok: false, error: message })
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    runMs: Date.now() - startedAt,
  })
}
