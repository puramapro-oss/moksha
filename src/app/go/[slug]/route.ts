import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

const REF_COOKIE = 'moksha_ref'
const PROMO_COOKIE = 'purama_promo'
const COOKIE_MAX_AGE_REF = 30 * 24 * 60 * 60 // 30 jours (influenceur)
const COOKIE_MAX_AGE_PROMO = 7 * 24 * 60 * 60 // 7 jours (cross-promo)

// Sources Purama connues (apps qui peuvent envoyer vers MOKSHA)
const KNOWN_PURAMA_APPS = new Set([
  'kash', 'midas', 'moksha', 'jurispurama', 'akasha', 'prana', 'vida',
  'kaia', 'sutra', 'adya', 'satya', 'lumios', 'origin', 'lingora',
  'compta', 'mana', 'aether', 'exodus', 'purama',
])

// Coupons Stripe valides (whitelist)
const VALID_COUPONS = new Set(['WELCOME50'])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await params
  const slug = rawSlug.toLowerCase()
  const origin = req.nextUrl.origin
  const coupon = req.nextUrl.searchParams.get('coupon')

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } },
  )

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32)

  // --- Cross-promo flow: ?coupon=WELCOME50 + source app connue ---
  if (coupon && VALID_COUPONS.has(coupon) && KNOWN_PURAMA_APPS.has(slug)) {
    await sb.from('moksha_cross_promos').insert({
      source_app: slug,
      target_app: 'moksha',
      ip_hash: ipHash,
      coupon_used: coupon,
    })

    const res = NextResponse.redirect(`${origin}/auth?promo=${coupon}`, 307)
    res.cookies.set(
      PROMO_COOKIE,
      JSON.stringify({
        coupon,
        source: slug,
        expires: Date.now() + COOKIE_MAX_AGE_PROMO * 1000,
      }),
      {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE_PROMO,
        path: '/',
      },
    )
    return res
  }

  // --- Influenceur flow (existant) ---
  const { data: inf } = await sb
    .from('moksha_influencer_profiles')
    .select('slug, approved')
    .eq('slug', slug)
    .eq('approved', true)
    .maybeSingle()

  if (!inf) {
    return NextResponse.redirect(`${origin}/`, 307)
  }

  await sb.from('moksha_influencer_clicks').insert({
    influencer_slug: slug,
    ip_hash: ipHash,
    user_agent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
    referer: req.headers.get('referer')?.slice(0, 200) ?? null,
  })

  const res = NextResponse.redirect(`${origin}/auth?ref=${encodeURIComponent(slug)}`, 307)
  res.cookies.set(REF_COOKIE, slug, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_REF,
    path: '/',
  })
  return res
}
