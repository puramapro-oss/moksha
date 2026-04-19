import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { createConnectAccount, createAccountSession } from '@/lib/stripe-connect'

export const runtime = 'nodejs'

/**
 * POST /api/connect/onboard
 * V4 — Crée (ou réutilise) un compte Stripe Connect Express pour le user
 *      et retourne un client_secret pour Embedded Onboarding.
 */
export async function POST(req: NextRequest) {
  void req
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const svc = createServiceClient()

    // Cherche un compte existant
    const { data: existing } = await svc
      .from('moksha_connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let stripeAccountId = existing?.stripe_account_id as string | undefined

    if (!stripeAccountId) {
      if (!user.email) {
        return NextResponse.json({ error: 'Email requis pour KYC Stripe' }, { status: 400 })
      }
      const account = await createConnectAccount({ userId: user.id, email: user.email, country: 'FR' })
      stripeAccountId = account.id
      const { error: insErr } = await svc.from('moksha_connect_accounts').insert({
        user_id: user.id,
        stripe_account_id: stripeAccountId,
        email: user.email,
        country: 'FR',
      })
      if (insErr) {
        return NextResponse.json({ error: `DB: ${insErr.message}` }, { status: 500 })
      }
    }

    const session = await createAccountSession(stripeAccountId)
    return NextResponse.json({
      client_secret: session.client_secret,
      stripe_account_id: stripeAccountId,
      expires_at: session.expires_at,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur Stripe Connect'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
