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
          const { data: profile } = await sb.from('moksha_profiles').select('email, referred_by').eq('id', userId).single()
          if (profile?.email) {
            await sendEmail({ to: profile.email, subject: 'Paiement confirmé — MOKSHA', html: emailTemplates.paiement_ok(plan) })
          }

          // Commission parrainage 1er paiement (50% du montant payé)
          if (profile?.referred_by) {
            const amountTotal = (session.amount_total ?? 0) / 100
            const commission = Math.round(amountTotal * 0.5 * 100) / 100
            // Idempotence : a-t-on déjà créé une commission "active" pour ce filleul ?
            const { data: existingRef } = await sb
              .from('moksha_referrals')
              .select('id, statut')
              .eq('referee_id', userId)
              .eq('referrer_id', profile.referred_by)
              .single()
            if (existingRef && existingRef.statut === 'pending' && commission > 0) {
              await sb
                .from('moksha_referrals')
                .update({ statut: 'active', commission_amount: commission })
                .eq('id', existingRef.id)
              await sb.from('moksha_wallet_transactions').insert({
                user_id: profile.referred_by,
                type: 'commission',
                amount: commission,
                description: `Commission 1er paiement filleul (${plan})`,
                statut: 'completed',
              })
              await sb.from('moksha_notifications').insert({
                user_id: profile.referred_by,
                type: 'commission',
                titre: `+${commission.toFixed(2)}€ encaissés 🔥`,
                message: `Ton filleul vient de prendre le plan ${plan}.`,
                action_url: '/dashboard/wallet',
              })
            }
          }
        }
        break
      }
      case 'invoice.payment_succeeded': {
        // Commission récurrente 10% sur chaque renouvellement
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (!customerId) break
        // Récupérer le user via stripe_customer_id
        const { data: profile } = await sb
          .from('moksha_profiles')
          .select('id, referred_by, plan')
          .eq('stripe_customer_id', customerId)
          .single()
        if (!profile?.referred_by) break
        // Skip la 1ère facture (déjà traitée par checkout.session.completed)
        if (invoice.billing_reason === 'subscription_create') break
        const amountPaid = (invoice.amount_paid ?? 0) / 100
        const commission = Math.round(amountPaid * 0.1 * 100) / 100
        if (commission <= 0) break
        await sb.from('moksha_wallet_transactions').insert({
          user_id: profile.referred_by,
          type: 'commission',
          amount: commission,
          description: `Commission récurrente 10% — filleul (${profile.plan})`,
          statut: 'completed',
        })
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
