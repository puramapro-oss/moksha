import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { POINTS_REWARDS } from '@/lib/constants'

const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
  category: z.enum(['general', 'jurisia', 'demarches', 'proofvault', 'wallet', 'autre']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const parsed = FeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides. Vérifie ta note (1-5) et ta catégorie.' }, { status: 400 })
    }

    const { rating, comment, category } = parsed.data

    await supabase.from('moksha_user_feedback').insert({
      user_id: user.id,
      rating,
      comment: comment || null,
      category,
      points_given: POINTS_REWARDS.feedback,
    })

    // Credit points
    await supabase.from('moksha_point_transactions').insert({
      user_id: user.id,
      amount: POINTS_REWARDS.feedback,
      type: 'feedback',
      description: `Feedback ${category} — ${rating}/5`,
    })
    await supabase.rpc('moksha_add_points', { p_user_id: user.id, p_amount: POINTS_REWARDS.feedback })

    return NextResponse.json({ message: `Merci pour ton retour ! +${POINTS_REWARDS.feedback} points.` })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
