import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * Lie le user authentifié au parrain dont le code est en cookie moksha_ref.
 * Idempotent — si déjà lié, no-op. Crée une ligne moksha_referrals (statut pending).
 * À appeler après login/signup réussi.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const cookieStore = await cookies()
    const refCookie = cookieStore.get('moksha_ref')?.value
    if (!refCookie) return NextResponse.json({ ok: true, applied: false })

    const svc = createServiceClient()

    // Vérifier que le user n'a pas déjà un parrain
    const { data: profile } = await svc
      .from('moksha_profiles')
      .select('id, referred_by, referral_code, created_at')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil absent' }, { status: 404 })

    // Anti-fraude : pas auto-parrainage
    if (profile.referral_code === refCookie) {
      cookieStore.delete('moksha_ref')
      return NextResponse.json({ ok: true, applied: false, reason: 'auto_referral' })
    }

    if (profile.referred_by) {
      cookieStore.delete('moksha_ref')
      return NextResponse.json({ ok: true, applied: false, reason: 'already_linked' })
    }

    // Trouver le parrain
    const { data: parrain } = await svc
      .from('moksha_profiles')
      .select('id, email')
      .eq('referral_code', refCookie)
      .single()

    if (!parrain) {
      cookieStore.delete('moksha_ref')
      return NextResponse.json({ ok: true, applied: false, reason: 'parrain_not_found' })
    }

    // Mise à jour referred_by
    await svc.from('moksha_profiles').update({ referred_by: parrain.id }).eq('id', user.id)

    // Créer la ligne moksha_referrals (statut pending — passera à active au paiement Stripe)
    await svc.from('moksha_referrals').insert({
      referrer_id: parrain.id,
      referee_id: user.id,
      code_used: refCookie,
      statut: 'pending',
      commission_amount: 0,
    })

    // Notif parrain
    await svc.from('moksha_notifications').insert({
      user_id: parrain.id,
      type: 'referral',
      titre: 'Nouveau filleul 🔥',
      message: `${user.email} vient de s'inscrire avec ton code. Tu toucheras 50% dès qu'il prend un plan.`,
      action_url: '/dashboard/parrainage',
    })

    cookieStore.delete('moksha_ref')
    return NextResponse.json({ ok: true, applied: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
