/**
 * MOKSHA V7.1 — POST /api/connect/account-session
 * Source: CLAUDE.md V7.1 §36.5 + STRIPE_CONNECT_KARMA_V4.md V4.1
 *
 * Crée une AccountSession Stripe Connect Embedded pour le user authentifié.
 * Retourne client_secret + expires_at pour ConnectComponentsProvider côté client.
 *
 * Pré-requis : un compte Connect existe (créé via /api/connect/onboard).
 * Sinon → 404 "Compte Connect non initialisé".
 *
 * Cet endpoint est appelé par chaque page /compte/* (notifications, gestion,
 * virements, paiements, soldes, documents, configuration) pour rafraîchir
 * la session ~toutes les 50 minutes (TTL 1h).
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { createAccountSession } from '@/lib/stripe-connect'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const svc = createServiceClient()
    const { data: account } = await svc
      .from('moksha_connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!account?.stripe_account_id) {
      return NextResponse.json(
        {
          error: 'Compte Connect non initialisé',
          hint: 'Appelle POST /api/connect/onboard d\'abord pour créer ton compte Stripe.',
        },
        { status: 404 },
      )
    }

    const session = await createAccountSession(account.stripe_account_id)
    return NextResponse.json({
      client_secret: session.client_secret,
      stripe_account_id: account.stripe_account_id,
      expires_at: session.expires_at,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur Stripe AccountSession'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
