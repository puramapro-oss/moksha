import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { POINTS_REWARDS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { platform } = await request.json()

    // Check max 3 shares per day
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('moksha_social_shares')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('shared_at', `${today}T00:00:00`)
      .lte('shared_at', `${today}T23:59:59`)

    if ((count ?? 0) >= POINTS_REWARDS.max_partage_jour) {
      return NextResponse.json({ error: 'Maximum 3 partages par jour atteint. Reviens demain !' }, { status: 400 })
    }

    // Get user referral code for share link
    const { data: profile } = await supabase
      .from('moksha_profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single()

    const shareCode = profile?.referral_code || `MOKSHA-${user.id.slice(0, 6).toUpperCase()}`

    await supabase.from('moksha_social_shares').insert({
      user_id: user.id,
      share_code: shareCode,
      platform_hint: platform || null,
      points_given: POINTS_REWARDS.partage,
      shared_at: new Date().toISOString(),
    })

    // Credit points
    await supabase.from('moksha_point_transactions').insert({
      user_id: user.id,
      amount: POINTS_REWARDS.partage,
      type: 'partage',
      description: `Partage ${platform || 'social'}`,
    })
    await supabase.rpc('moksha_add_points', { p_user_id: user.id, p_amount: POINTS_REWARDS.partage })

    return NextResponse.json({
      message: `+${POINTS_REWARDS.partage} points ! Merci pour le partage.`,
      shareUrl: `https://moksha.purama.dev/share/${shareCode}`,
      shareCode,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
