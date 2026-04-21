import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { stampContent } from '@/lib/opentimestamps'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export const runtime = 'nodejs'

const PublishSchema = z.object({
  version: z.string().min(2).max(30),
  content: z.string().min(100),
  content_url: z.string().url().optional(),
})

/**
 * POST /api/reglement/publish (admin-only)
 * V7.1 : horodate le règlement sur OpenTimestamps (Bitcoin) et insert dans
 * moksha_reglements. Désactive automatiquement les versions précédentes
 * (active=false). La preuve est INCOMPLETE au stamping initial — elle est
 * upgraded ~1-2h plus tard par CRON quand Bitcoin confirme l'ancrage.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin requis' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = PublishSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalide' }, { status: 400 })
    }

    const stamp = await stampContent(parsed.data.content)

    const svc = createServiceClient()
    // Désactive l'ancienne version active
    await svc.from('moksha_reglements').update({ active: false }).eq('active', true)

    const { data, error } = await svc
      .from('moksha_reglements')
      .insert({
        version: parsed.data.version,
        content_hash: stamp.contentHash,
        opentimestamps_proof: stamp.proof,
        blockchain: 'bitcoin',
        content_url: parsed.data.content_url ?? `/reglement?v=${parsed.data.version}`,
        active: true,
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 })

    return NextResponse.json({
      ok: true,
      reglement: data,
      stamp_status: 'pending_anchor',
      message: 'Règlement horodaté. Ancrage Bitcoin en attente (~1-2h).',
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function GET() {
  const svc = createServiceClient()
  const { data } = await svc
    .from('moksha_reglements_status')
    .select('id, version, content_hash, blockchain, stamp_status, bitcoin_block_height, bitcoin_block_timestamp, published_at, active')
    .order('published_at', { ascending: false })
    .limit(20)
  return NextResponse.json({ reglements: data ?? [] })
}
