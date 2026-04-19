import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { transferToConnect } from '@/lib/stripe-connect'

export const runtime = 'nodejs'

/**
 * POST /api/bourses/disburse
 * V4 — verse 1× la bourse Asso sur le compte Connect du user.
 * Conditions: missions_completees>=5, !versee, financement_source != 'pending', Connect OK.
 *
 * DUAL CIRCUIT STRICT: financement_source doit être une subvention (préfixe subvention_).
 * Code applicatif + CHECK DB garantissent que ce n'est JAMAIS financé par SASU (prime CPA).
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const svc = createServiceClient()
    const { data: bourse } = await svc
      .from('moksha_bourses_inclusion')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<{
        id: string
        montant_eur: number
        missions_completees: number
        missions_requises: number
        versee: boolean
        financement_source: string
      }>()

    if (!bourse) return NextResponse.json({ error: 'Bourse non éligible' }, { status: 403 })
    if (bourse.versee) return NextResponse.json({ error: 'Bourse déjà versée' }, { status: 400 })
    if (bourse.missions_completees < bourse.missions_requises) {
      return NextResponse.json({
        error: `Manque ${bourse.missions_requises - bourse.missions_completees} mission(s)`,
      }, { status: 400 })
    }

    // Dual circuit check: JAMAIS financement SASU pour bourse Asso
    if (!bourse.financement_source.startsWith('subvention_')) {
      return NextResponse.json({
        error: 'Bourse en attente de subvention Asso. Contacte le support.',
      }, { status: 402 })
    }

    const { data: connect } = await svc
      .from('moksha_connect_accounts')
      .select('stripe_account_id, payouts_enabled')
      .eq('user_id', user.id)
      .maybeSingle<{ stripe_account_id: string; payouts_enabled: boolean }>()

    if (!connect?.stripe_account_id || !connect.payouts_enabled) {
      return NextResponse.json({
        error: 'Active Stripe Connect avant versement (/dashboard/wallet/connect)',
      }, { status: 403 })
    }

    const idempotencyKey = `bourse_${bourse.id}`
    try {
      const transfer = await transferToConnect({
        stripeAccountId: connect.stripe_account_id,
        amountCents: Math.round(Number(bourse.montant_eur) * 100),
        description: `Bourse d'inclusion MOKSHA — ${bourse.financement_source}`,
        metadata: {
          user_id: user.id,
          bourse_id: bourse.id,
          financement_source: bourse.financement_source,
          circuit: 'asso',
        },
        idempotencyKey,
      })

      await svc
        .from('moksha_bourses_inclusion')
        .update({
          versee: true,
          versee_at: new Date().toISOString(),
          stripe_transfer_id: transfer.id,
        })
        .eq('id', bourse.id)

      await svc.from('moksha_wallet_transactions').insert({
        user_id: user.id,
        type: 'bourse_inclusion',
        amount: Number(bourse.montant_eur),
        description: `Bourse d'inclusion Purama (Asso — ${bourse.financement_source})`,
        statut: 'completed',
        direction: 'credit',
        source: 'bourse_asso',
        source_id: bourse.id,
        stripe_transfer_id: transfer.id,
      })

      await svc.rpc('apply_wallet_transaction_v4', {
        p_user_id: user.id,
        p_amount: Number(bourse.montant_eur),
        p_direction: 'credit',
      })

      await svc.from('moksha_notifications').insert({
        user_id: user.id,
        type: 'bourse_versee',
        titre: `🎉 Ta bourse d'inclusion ${bourse.montant_eur}€ est versée`,
        message: `Financée par une subvention Asso Purama. Arrive sur ton compte Stripe Connect.`,
        action_url: '/dashboard/wallet',
      })

      return NextResponse.json({
        ok: true,
        amount_eur: bourse.montant_eur,
        transfer_id: transfer.id,
      })
    } catch (e) {
      return NextResponse.json({
        error: e instanceof Error ? e.message : 'Transfer Stripe échoué',
      }, { status: 500 })
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
