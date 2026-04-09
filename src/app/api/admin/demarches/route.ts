import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const statut = req.nextUrl.searchParams.get('statut')
  const svc = createServiceClient()

  let q = svc
    .from('moksha_demarches')
    .select('id, user_id, type, titre, mode, statut, avancement, inpi_reference, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (statut) q = q.eq('statut', statut)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Joindre email user
  const ids = Array.from(new Set((data || []).map((d) => d.user_id)))
  const { data: profs } = await svc
    .from('moksha_profiles')
    .select('id, email, full_name')
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  const profMap = new Map((profs || []).map((p) => [p.id, p]))

  return NextResponse.json({
    demarches: (data || []).map((d) => ({
      ...d,
      user_email: profMap.get(d.user_id)?.email || '—',
      user_name: profMap.get(d.user_id)?.full_name || '—',
    })),
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error

  const { id, statut, notes } = (await req.json()) as { id?: string; statut?: string; notes?: string }
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (statut) update.statut = statut
  if (notes !== undefined) update.notes = notes
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 })

  const svc = createServiceClient()
  const { error } = await svc.from('moksha_demarches').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
