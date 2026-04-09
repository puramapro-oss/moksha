import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const svc = createServiceClient()
  const { data: concours } = await svc
    .from('moksha_concours')
    .select('*')
    .order('date_debut', { ascending: false })

  // Compter participants par concours
  const ids = (concours || []).map((c) => c.id)
  let countsMap = new Map<string, number>()
  if (ids.length) {
    const { data: parts } = await svc
      .from('moksha_concours_participants')
      .select('concours_id')
      .in('concours_id', ids)
    countsMap = (parts || []).reduce((m, p) => {
      m.set(p.concours_id, (m.get(p.concours_id) || 0) + 1)
      return m
    }, new Map<string, number>())
  }

  return NextResponse.json({
    concours: (concours || []).map((c) => ({ ...c, participants_count: countsMap.get(c.id) || 0 })),
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const body = (await req.json()) as {
    titre?: string
    description?: string
    type?: string
    date_debut?: string
    date_fin?: string
    prix?: unknown
  }
  if (!body.titre || !body.date_debut || !body.date_fin || !body.type) {
    return NextResponse.json({ error: 'titre, type, date_debut, date_fin requis' }, { status: 400 })
  }
  const svc = createServiceClient()
  const { data, error } = await svc
    .from('moksha_concours')
    .insert({
      titre: body.titre,
      description: body.description || null,
      type: body.type,
      date_debut: body.date_debut,
      date_fin: body.date_fin,
      prix: body.prix || [],
      actif: true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ concours: data })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const { id, actif } = (await req.json()) as { id?: string; actif?: boolean }
  if (!id || typeof actif !== 'boolean') return NextResponse.json({ error: 'id + actif requis' }, { status: 400 })
  const svc = createServiceClient()
  const { error } = await svc.from('moksha_concours').update({ actif }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if ('error' in auth) return auth.error
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
  const svc = createServiceClient()
  const { error } = await svc.from('moksha_concours').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
