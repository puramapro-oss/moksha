import { NextResponse, type NextRequest } from 'next/server'
import { stripe, STRIPE_PLANS, type StripePlanKey } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { plan, interval } = await req.json()
    const key = `${plan}_${interval}` as StripePlanKey
    const planSpec = STRIPE_PLANS[key]
    if (!planSpec) return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    if (user.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Super admin — aucun paiement requis' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
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
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/paiement?plan=${plan}&interval=${interval}`,
      metadata: { user_id: user.id, plan: planSpec.plan, app: 'moksha' },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
