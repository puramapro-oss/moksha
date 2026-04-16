import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { sendEmail, emailTemplates } from '@/lib/resend'
import { payReferralCommissions } from '@/lib/referrals'

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
        const crossPromoId = session.metadata?.cross_promo_id
        if (crossPromoId) {
          await sb
            .from('moksha_cross_promos')
            .update({ converted: true, converted_at: new Date().toISOString() })
            .eq('id', crossPromoId)
        }
        if (userId && plan) {
          const now = new Date().toISOString()
          const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null
          const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null
          await sb
            .from('moksha_profiles')
            .update({
              plan,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              subscription_started_at: now,
            })
            .eq('id', userId)

          // V7 §11 — table subscriptions (source de vérité)
          if (stripeSubscriptionId) {
            await sb.from('moksha_subscriptions').upsert({
              user_id: userId,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_customer_id: stripeCustomerId,
              status: 'active',
              plan,
              started_at: now,
            }, { onConflict: 'stripe_subscription_id' })
          }

          // V7 §10 — Prime J+0 = 25€ wallet (PRIME_MODE=phase1 3 paliers 25/25/50)
          // Idempotence : check si déjà crédité pour ce sub
          const { data: alreadyPaid } = await sb
            .from('moksha_wallet_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'prime')
            .eq('description', `Prime bienvenue J+0 (${stripeSubscriptionId || 'sub'})`)
            .maybeSingle()
          if (!alreadyPaid) {
            await sb.from('moksha_wallet_transactions').insert({
              user_id: userId,
              type: 'prime',
              amount: 25,
              description: `Prime bienvenue J+0 (${stripeSubscriptionId || 'sub'})`,
              statut: 'completed',
            })
            await sb.from('moksha_notifications').insert({
              user_id: userId,
              type: 'prime',
              titre: '+25€ prime de bienvenue 🎁',
              message: 'Tranche 1/3 créditée. Tranches suivantes à M+1 et M+2. Retrait disponible après 30 jours.',
              action_url: '/dashboard/wallet',
            })
          }

          const { data: profile } = await sb.from('moksha_profiles').select('email, referred_by').eq('id', userId).single()
          if (profile?.email) {
            await sendEmail({ to: profile.email, subject: 'Paiement confirmé — MOKSHA', html: emailTemplates.paiement_ok(plan) })
          }

          // V7 §10 — Commission parrainage 3 niveaux (N1=50% | N2=15% | N3=7%)
          const amountTotal = (session.amount_total ?? 0) / 100
          await payReferralCommissions(sb, {
            refereeId: userId,
            amountPaidEur: amountTotal,
            idempotencyKey: `checkout_${session.id}`,
            planLabel: plan,
          })
        }
        break
      }
      case 'invoice.payment_succeeded': {
        // V7 §10 — Commission 3 niveaux à vie sur chaque renouvellement
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (!customerId) break
        // Skip la 1ère facture (déjà traitée par checkout.session.completed)
        if (invoice.billing_reason === 'subscription_create') break
        const { data: profile } = await sb
          .from('moksha_profiles')
          .select('id, plan')
          .eq('stripe_customer_id', customerId)
          .single()
        if (!profile?.id) break
        const amountPaid = (invoice.amount_paid ?? 0) / 100
        await payReferralCommissions(sb, {
          refereeId: profile.id,
          amountPaidEur: amountPaid,
          idempotencyKey: `invoice_${invoice.id}`,
          planLabel: profile.plan,
        })
        break
      }
      case 'customer.subscription.created':
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
          await sb.from('moksha_subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : null,
            status: sub.status,
            plan: sub.metadata?.plan || 'autopilote',
            cancelled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'stripe_subscription_id' })
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (!customerId) break
        const { data: profile } = await sb
          .from('moksha_profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()
        if (profile?.email) {
          await sendEmail({
            to: profile.email,
            subject: 'Paiement échoué — MOKSHA',
            html: `<p>Ton paiement n'a pas pu être débité. Nouvelle tentative dans 24h. Mets à jour ta carte : <a href="https://moksha.purama.dev/dashboard/parametres/abonnement">gérer mon abonnement</a>.</p>`,
          })
          await sb.from('moksha_notifications').insert({
            user_id: profile.id,
            type: 'payment_failed',
            titre: 'Paiement échoué ⚠️',
            message: 'Mets à jour ta carte pour ne pas perdre ton accès.',
            action_url: '/dashboard/parametres/abonnement',
          })
        }
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const customerId = typeof charge.customer === 'string' ? charge.customer : null
        if (!customerId) break
        const { data: profile } = await sb
          .from('moksha_profiles')
          .select('id, subscription_started_at, email')
          .eq('stripe_customer_id', customerId)
          .single()
        if (!profile) break
        // §10 — Annulation <30j = prime déduite
        const started = profile.subscription_started_at ? new Date(profile.subscription_started_at) : null
        const within30d = started ? (Date.now() - started.getTime()) < 30 * 24 * 3600 * 1000 : false
        const refundAmount = (charge.amount_refunded ?? 0) / 100
        let primeDeducted = 0
        if (within30d) {
          // Récupère primes déjà versées
          const { data: primes } = await sb
            .from('moksha_wallet_transactions')
            .select('amount')
            .eq('user_id', profile.id)
            .eq('type', 'prime')
          primeDeducted = (primes ?? []).reduce((s, p) => s + Number(p.amount || 0), 0)
        }
        await sb.from('moksha_retractions').insert({
          user_id: profile.id,
          stripe_subscription_id: typeof charge.payment_intent === 'string' ? charge.payment_intent : null,
          amount_refunded: refundAmount,
          prime_deducted: primeDeducted,
          processed: true,
          processed_at: new Date().toISOString(),
          reason: within30d ? 'rétractation <30j (art. L221-28)' : 'remboursement commercial',
        })
        // Coupe l'accès immédiatement
        await sb.from('moksha_profiles').update({ plan: 'gratuit' }).eq('id', profile.id)
        if (profile.email) {
          await sendEmail({
            to: profile.email,
            subject: 'Remboursement effectué — MOKSHA',
            html: `<p>Ton remboursement de ${refundAmount.toFixed(2)}€ a été traité.${primeDeducted > 0 ? ` Prime de bienvenue déduite : ${primeDeducted.toFixed(2)}€ (art. L221-28, CGU).` : ''}</p>`,
          })
        }
        break
      }
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Webhook error' }, { status: 500 })
  }
}
