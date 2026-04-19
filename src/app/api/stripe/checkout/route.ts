import { NextResponse, type NextRequest } from 'next/server'
import { stripe, STRIPE_PLANS, type StripePlanKey, ACTIVE_STRIPE_PLAN_KEYS } from '@/lib/stripe'

type CheckoutSessionParams = Parameters<typeof stripe.checkout.sessions.create>[0]
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export const runtime = 'nodejs'

const VALID_COUPONS = new Set(['WELCOME50'])

type PuramaPromo = { coupon: string; source: string; expires: number }

function readPuramaPromo(req: NextRequest): PuramaPromo | null {
  const raw = req.cookies.get('purama_promo')?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PuramaPromo
    if (!parsed?.coupon || !parsed?.source) return null
    if (!VALID_COUPONS.has(parsed.coupon)) return null
    if (typeof parsed.expires === 'number' && parsed.expires < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { plan, interval } = (await req.json()) as { plan?: string; interval?: string }
    const normalizedPlan = plan ?? 'premium'
    const normalizedInterval = interval ?? 'mensuel'
    const key = `${normalizedPlan}_${normalizedInterval}` as StripePlanKey
    const planSpec = STRIPE_PLANS[key]
    if (!planSpec) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // V4 — refus de souscription nouveaux plans legacy (autopilote/pro) pour non-abonnés.
    // Les utilisateurs existants Autopilote/Pro restent sur leur plan (grandfather webhook).
    if (!ACTIVE_STRIPE_PLAN_KEYS.includes(key as (typeof ACTIVE_STRIPE_PLAN_KEYS)[number])) {
      const { data: profile } = await supabase
        .from('moksha_profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle()
      const currentPlan = profile?.plan as string | undefined
      if (currentPlan !== normalizedPlan) {
        return NextResponse.json(
          { error: 'Ce plan est réservé aux abonnés existants. Choisis MOKSHA Premium.' },
          { status: 400 },
        )
      }
    }

    if (user.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Super admin — aucun paiement requis' }, { status: 400 })
    }

    // V7 §15 — Cross-promo : lire cookie purama_promo → discount auto
    const promo = readPuramaPromo(req)

    // Si un coupon promo s'applique, on associe le clic à l'user et on propage l'ID
    // au Checkout metadata pour marquer converted=true au webhook.
    let crossPromoId: string | null = null
    if (promo) {
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { db: { schema: 'moksha' } },
      )
      // Rattache le clic anonyme le plus récent (pour cette source, dernière heure) à l'user
      const { data: recent } = await admin
        .from('moksha_cross_promos')
        .select('id')
        .eq('source_app', promo.source)
        .eq('target_app', 'moksha')
        .eq('coupon_used', promo.coupon)
        .is('user_id', null)
        .gte('clicked_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('clicked_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recent?.id) {
        await admin
          .from('moksha_cross_promos')
          .update({ user_id: user.id, signed_up_at: new Date().toISOString() })
          .eq('id', recent.id)
        crossPromoId = recent.id
      } else {
        // Pas de clic anonyme trouvé → insère un nouveau row avec user_id direct
        const { data: inserted } = await admin
          .from('moksha_cross_promos')
          .insert({
            source_app: promo.source,
            target_app: 'moksha',
            user_id: user.id,
            coupon_used: promo.coupon,
            signed_up_at: new Date().toISOString(),
          })
          .select('id')
          .single()
        crossPromoId = inserted?.id ?? null
      }
    }

    // Construit les params Stripe avec discount si présent
    const sessionParams: CheckoutSessionParams = {
      mode: 'subscription',
      payment_method_types: ['card', 'link', 'paypal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            recurring: { interval: planSpec.interval },
            product_data: {
              name: planSpec.name,
              description: planSpec.description,
            },
            unit_amount: planSpec.unit_amount,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      subscription_data: {
        trial_period_days: 14,
        metadata: { user_id: user.id, plan: planSpec.plan, app: 'moksha' },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/paiement?plan=${plan}&interval=${interval}`,
      metadata: {
        user_id: user.id,
        plan: planSpec.plan,
        app: 'moksha',
        ...(crossPromoId ? { cross_promo_id: crossPromoId } : {}),
        ...(promo ? { cross_promo_source: promo.source, cross_promo_coupon: promo.coupon } : {}),
      },
    }

    if (promo) {
      // Coupon Stripe appliqué automatiquement (pas de saisie manuelle)
      sessionParams.discounts = [{ coupon: promo.coupon }]
    } else {
      sessionParams.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    const res = NextResponse.json({ url: session.url })
    // Coupon consommé → on efface le cookie (évite double usage sur un autre checkout)
    if (promo) {
      res.cookies.set('purama_promo', '', { path: '/', maxAge: 0 })
    }
    return res
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
