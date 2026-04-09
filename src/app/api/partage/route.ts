import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

/** Crée un lien de partage temporaire pour 1+ documents (banque, auditeur). */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { document_ids, audience, days } = (await req.json()) as {
      document_ids?: string[]
      audience?: 'banque' | 'auditeur' | 'partenaire'
      days?: number
    }
    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ error: 'document_ids requis' }, { status: 400 })
    }
    const ttl = Math.min(Math.max(Number(days) || 7, 1), 30)
    const aud = audience || 'partenaire'

    const svc = createServiceClient()

    // Vérifier ownership de tous les docs
    const { data: docs, error: docsErr } = await svc
      .from('moksha_documents')
      .select('id, user_id')
      .in('id', document_ids)
    if (docsErr) return NextResponse.json({ error: docsErr.message }, { status: 500 })
    if (!docs || docs.length !== document_ids.length) {
      return NextResponse.json({ error: 'Document(s) introuvable(s)' }, { status: 404 })
    }
    if (docs.some((d) => d.user_id !== user.id)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Génère un token unique partagé sur tous les docs
    const token = randomBytes(24).toString('hex')
    const expire = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000).toISOString()

    await svc
      .from('moksha_documents')
      .update({
        partage_token: token,
        partage_expire: expire,
        metadata: { audience: aud },
      })
      .in('id', document_ids)

    return NextResponse.json({
      ok: true,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/partage/${token}`,
      expire,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Liste les liens actifs pour l'utilisateur
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const svc = createServiceClient()
  const { data: docs } = await svc
    .from('moksha_documents')
    .select('id, nom, partage_token, partage_expire, metadata')
    .eq('user_id', user.id)
    .not('partage_token', 'is', null)
    .order('partage_expire', { ascending: false })

  // Group by token
  const groups = new Map<string, { token: string; expire: string; audience: string; docs: Array<{ id: string; nom: string }> }>()
  for (const d of docs || []) {
    if (!d.partage_token || !d.partage_expire) continue
    if (new Date(d.partage_expire) < new Date()) continue
    const k = d.partage_token
    const meta = (d.metadata as { audience?: string }) || {}
    if (!groups.has(k)) groups.set(k, { token: k, expire: d.partage_expire, audience: meta.audience || 'partenaire', docs: [] })
    groups.get(k)!.docs.push({ id: d.id, nom: d.nom })
  }

  return NextResponse.json({ shares: Array.from(groups.values()) })

  // unused param suppression
  void req
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token requis' }, { status: 400 })

  const svc = createServiceClient()
  await svc
    .from('moksha_documents')
    .update({ partage_token: null, partage_expire: null })
    .eq('user_id', user.id)
    .eq('partage_token', token)
  return NextResponse.json({ ok: true })
}
