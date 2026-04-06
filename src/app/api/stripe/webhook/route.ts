import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendEmail, emailTemplates } from '@/lib/resend'

export const runtime = 'nodejs'

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'moksha' } }
  )
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Bad sig' }, { status: 400 })
  }

  const sb = admin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan
        if (userId && plan) {
          await sb
            .from('moksha_profiles')
            .update({
              plan,
              stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
              stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
            })
            .eq('id', userId)
          const { data: profile } = await sb.from('moksha_profiles').select('email').eq('id', userId).single()
          if (profile?.email) {
            await sendEmail({ to: profile.email, subject: 'Paiement confirmé — MOKSHA', html: emailTemplates.paiement_ok(plan) })
          }
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (userId) {
          const plan = sub.status === 'active' || sub.status === 'trialing' ? sub.metadata?.plan || 'autopilote' : 'gratuit'
          await sb
            .from('moksha_profiles')
            .update({
              plan,
              stripe_subscription_id: sub.id,
            })
            .eq('id', userId)
        }
        break
      }
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Webhook error' }, { status: 500 })
  }
}
