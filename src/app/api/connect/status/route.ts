import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { getConnectAccountStatus } from '@/lib/stripe-connect'

export const runtime = 'nodejs'

/**
 * GET /api/connect/status
 * V4 — Retourne l'état KYC Stripe Connect du user (poll UI Embedded).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const svc = createServiceClient()
    const { data: account } = await svc
      .from('moksha_connect_accounts')
      .select('stripe_account_id, onboarding_completed, payouts_enabled, charges_enabled, kyc_verified_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!account?.stripe_account_id) {
      return NextResponse.json({
        exists: false,
        onboarding_completed: false,
        payouts_enabled: false,
        charges_enabled: false,
      })
    }

    // Poll Stripe pour obtenir l'état en temps réel (webhooks peuvent être retardés)
    const status = await getConnectAccountStatus(account.stripe_account_id)

    // Sync DB si différent
    if (
      status.onboardingCompleted !== account.onboarding_completed ||
      status.payoutsEnabled !== account.payouts_enabled ||
      status.chargesEnabled !== account.charges_enabled
    ) {
      await svc
        .from('moksha_connect_accounts')
        .update({
          onboarding_completed: status.onboardingCompleted,
          payouts_enabled: status.payoutsEnabled,
          charges_enabled: status.chargesEnabled,
          details_submitted: status.detailsSubmitted,
          requirements: status.requirements ?? {},
          kyc_verified_at: status.onboardingCompleted && !account.kyc_verified_at ? new Date().toISOString() : account.kyc_verified_at,
        })
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      exists: true,
      stripe_account_id: account.stripe_account_id,
      onboarding_completed: status.onboardingCompleted,
      payouts_enabled: status.payoutsEnabled,
      charges_enabled: status.chargesEnabled,
      details_submitted: status.detailsSubmitted,
      requirements_count: status.requirements?.currently_due?.length ?? 0,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur status Connect'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
