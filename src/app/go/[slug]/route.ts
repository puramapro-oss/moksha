import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

const REF_COOKIE = 'moksha_ref'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 jours

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const origin = req.nextUrl.origin

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } },
  )

  // Vérifie que l'influenceur existe
  const { data: inf } = await sb
    .from('moksha_influencer_profiles')
    .select('slug, approved')
    .eq('slug', slug)
    .eq('approved', true)
    .maybeSingle()

  if (!inf) {
    return NextResponse.redirect(`${origin}/`, 307)
  }

  // Track click (anonyme, hash IP)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ip_hash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32)

  await sb.from('moksha_influencer_clicks').insert({
    influencer_slug: slug,
    ip_hash,
    user_agent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
    referer: req.headers.get('referer')?.slice(0, 200) ?? null,
  })

  // Redirige vers /auth avec cookie ref
  const res = NextResponse.redirect(`${origin}/auth?ref=${encodeURIComponent(slug)}`, 307)
  res.cookies.set(REF_COOKIE, slug, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
