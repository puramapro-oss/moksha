import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { buildTicketInserts, TICKET_RULES, type TicketSource } from '@/lib/karma-tickets'

export const runtime = 'nodejs'

const AwardSchema = z.object({
  source: z.enum(
    Object.keys(TICKET_RULES) as [TicketSource, ...TicketSource[]],
  ),
  proof_url: z.string().url().optional(),
})

/**
 * POST /api/karma/ticket — attribution auto d'un ticket selon la source.
 * Anti-abus: max_per_day via check count(created_at > today).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = AwardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalide' }, { status: 400 })
    }

    const rule = TICKET_RULES[parsed.data.source]
    const svc = createServiceClient()

    // Anti-abus: max_per_day
    if (rule.maxPerDay) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const { count } = await svc
        .from('moksha_karma_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('source', parsed.data.source)
        .gte('created_at', dayStart.toISOString())
      if ((count ?? 0) >= rule.maxPerDay) {
        return NextResponse.json({ error: `Limite ${rule.maxPerDay}/jour atteinte pour ${rule.label}` }, { status: 429 })
      }
    }

    // Récupère status abonné pour multiplicateur ×5
    const { data: profile } = await svc
      .from('moksha_profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle<{ plan: string }>()
    const isPaying = profile?.plan && profile.plan !== 'gratuit'

    const inserts = buildTicketInserts(user.id, parsed.data.source, Boolean(isPaying))
    if (inserts.length === 0) {
      return NextResponse.json({ error: 'Aucun ticket à attribuer' }, { status: 400 })
    }

    const { error } = await svc.from('moksha_karma_tickets').insert(inserts)
    if (error) return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 })

    return NextResponse.json({
      ok: true,
      tickets_awarded: inserts.length,
      source: parsed.data.source,
      multiplier: inserts[0]?.multiplier ?? 1,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const svc = createServiceClient()
    const { data: tickets } = await svc
      .from('moksha_karma_tickets')
      .select('source, draw_type, draw_period, multiplier, used, created_at')
      .eq('user_id', user.id)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(100)

    const totals = (tickets ?? []).reduce(
      (acc, t) => {
        const key = t.draw_type as 'week' | 'month' | 'jackpot_terre'
        acc[key] = (acc[key] ?? 0) + Number(t.multiplier ?? 1)
        return acc
      },
      { week: 0, month: 0, jackpot_terre: 0 } as Record<string, number>,
    )

    return NextResponse.json({ tickets, totals, rules: TICKET_RULES })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
