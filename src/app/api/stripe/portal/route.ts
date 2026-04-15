import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const bodySchema = z.object({
  action: z.enum(['cancel', 'manage']),
  reason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }
    const { action, reason } = parsed.data

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const sb = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'moksha' } }
    )
    const { data: profile } = await sb
      .from('moksha_profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()
    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 404 })
    }

    if (action === 'cancel') {
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
        metadata: { cancel_reason: reason || '' },
      })
      await sb
        .from('moksha_subscriptions')
        .update({ cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', profile.stripe_subscription_id)
      return NextResponse.json({ ok: true })
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Customer Stripe introuvable' }, { status: 404 })
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'}/dashboard/parametres/abonnement`,
    })
    return NextResponse.json({ url: portal.url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
