import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DAILY_GIFT_CHANCES } from '@/lib/constants'

function rollGift(): { type: string; value: string; points?: number } {
  const roll = Math.random() * 100
  let cumulative = 0

  cumulative += DAILY_GIFT_CHANCES.points_small
  if (roll < cumulative) {
    const pts = Math.floor(Math.random() * 16) + 5 // 5-20
    return { type: 'points', value: `${pts} points`, points: pts }
  }

  cumulative += DAILY_GIFT_CHANCES.coupon_small
  if (roll < cumulative) {
    const pct = Math.random() > 0.5 ? 10 : 5
    return { type: 'coupon', value: `-${pct}% (7 jours)` }
  }

  cumulative += DAILY_GIFT_CHANCES.ticket
  if (roll < cumulative) {
    return { type: 'ticket', value: '1 ticket tirage mensuel' }
  }

  cumulative += DAILY_GIFT_CHANCES.credits
  if (roll < cumulative) {
    return { type: 'credits', value: '+3 crédits JurisIA' }
  }

  cumulative += DAILY_GIFT_CHANCES.points_big
  if (roll < cumulative) {
    return { type: 'coupon', value: '-20% (3 jours)' }
  }

  cumulative += DAILY_GIFT_CHANCES.coupon_big
  if (roll < cumulative) {
    const pts = Math.floor(Math.random() * 51) + 50 // 50-100
    return { type: 'points', value: `${pts} points`, points: pts }
  }

  return { type: 'coupon', value: '-50% (24h)' }
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Check if already opened today
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('moksha_daily_gifts')
      .select('id')
      .eq('user_id', user.id)
      .gte('opened_at', `${today}T00:00:00`)
      .lte('opened_at', `${today}T23:59:59`)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Tu as déjà ouvert ton coffre aujourd\'hui. Reviens demain !' }, { status: 400 })
    }

    // Get streak
    const { data: lastGift } = await supabase
      .from('moksha_daily_gifts')
      .select('streak_count, opened_at')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })
      .limit(1)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let streak = 1
    if (lastGift?.[0]) {
      const lastDate = lastGift[0].opened_at.split('T')[0]
      if (lastDate === yesterdayStr) {
        streak = lastGift[0].streak_count + 1
      }
    }

    const gift = rollGift()

    // Save gift
    await supabase.from('moksha_daily_gifts').insert({
      user_id: user.id,
      gift_type: gift.type,
      gift_value: gift.value,
      streak_count: streak,
      opened_at: new Date().toISOString(),
    })

    // If points gift, credit them
    if (gift.points) {
      await supabase.from('moksha_point_transactions').insert({
        user_id: user.id,
        amount: gift.points,
        type: 'daily_gift',
        description: `Coffre quotidien — ${gift.value}`,
      })
      await supabase.rpc('moksha_add_points', { p_user_id: user.id, p_amount: gift.points })
    }

    return NextResponse.json({ gift, streak })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
