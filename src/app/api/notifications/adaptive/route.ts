import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Suggestion = {
  type: 'breathe' | 'gratitude' | 'intention' | 'streak_risk' | 'financer' | 'wrapped' | 'idle'
  titre: string
  message: string
  action_url: string
  priority: number
}

/**
 * Analyse l'activité récente de l'utilisateur et retourne une suggestion personnalisée.
 * Pas d'appel IA externe — simple heuristique basée sur les données, rapide et gratuit.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const today = new Date()
    const dayStart = new Date(today).setHours(0, 0, 0, 0)
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [gratRes, intRes, breathRes, giftRes, dossRes, ptsRes] = await Promise.all([
      supabase
        .from('moksha_gratitude_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(dayStart).toISOString()),
      supabase
        .from('moksha_intentions')
        .select('id, completed, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(dayStart).toISOString())
        .maybeSingle(),
      supabase
        .from('moksha_breath_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(dayStart).toISOString()),
      supabase
        .from('moksha_daily_gifts')
        .select('opened_at, streak_count')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('moksha_dossiers_financement')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('moksha_point_transactions')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo)
        .limit(1)
        .maybeSingle(),
    ])

    const suggestions: Suggestion[] = []
    const hour = today.getHours()

    // Streak en danger: dernier daily_gift hier mais pas aujourd'hui
    if (giftRes.data?.opened_at) {
      const lastOpen = new Date(giftRes.data.opened_at)
      const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - lastOpen.setHours(0, 0, 0, 0)) / 86400000)
      if (diffDays === 1 && giftRes.data.streak_count >= 3) {
        suggestions.push({
          type: 'streak_risk',
          titre: `🔥 Ton streak de ${giftRes.data.streak_count} jours va tomber`,
          message: 'Ouvre ton coffre quotidien avant minuit pour le sauver.',
          action_url: '/dashboard/points',
          priority: 100,
        })
      }
    }

    // Gratitude du jour non faite (après 10h)
    if (hour >= 10 && (gratRes.count ?? 0) === 0) {
      suggestions.push({
        type: 'gratitude',
        titre: 'Ta gratitude du jour',
        message: 'Écris 1 gratitude en 10 secondes et gagne +100 points.',
        action_url: '/dashboard/gratitude',
        priority: 50,
      })
    }

    // Pas d'intention posée
    if (!intRes.data && hour < 14) {
      suggestions.push({
        type: 'intention',
        titre: 'Ton intention du jour',
        message: 'Pose ton intention matinale pour donner une direction claire.',
        action_url: '/dashboard/intentions',
        priority: 60,
      })
    }

    // Intention posée mais non accomplie, soir
    if (intRes.data && !intRes.data.completed && hour >= 18) {
      suggestions.push({
        type: 'intention',
        titre: 'Et ton intention ?',
        message: 'Ton intention du jour est-elle accomplie ? Marque-la.',
        action_url: '/dashboard/intentions',
        priority: 70,
      })
    }

    // Respiration si pas faite
    if ((breathRes.count ?? 0) === 0 && hour >= 12) {
      suggestions.push({
        type: 'breathe',
        titre: '3 min pour te recentrer',
        message: 'Une session de respiration 4-7-8 = +50 points + clarté mentale.',
        action_url: '/dashboard/breathe',
        priority: 30,
      })
    }

    // Jamais testé /financer
    if ((dossRes.count ?? 0) === 0) {
      suggestions.push({
        type: 'financer',
        titre: '💰 Vérifie tes aides',
        message: 'Tu peux récupérer jusqu\'à 1M€ d\'aides publiques. 2 minutes pour vérifier.',
        action_url: '/dashboard/financer',
        priority: 40,
      })
    }

    // User inactif depuis 7j
    if (!ptsRes.data) {
      suggestions.push({
        type: 'idle',
        titre: 'On t\'a manqué',
        message: 'Tes données et ton streak t\'attendent. Reviens quand tu veux.',
        action_url: '/dashboard',
        priority: 20,
      })
    }

    // Wrapped dispo si on est en début de mois
    const dayOfMonth = today.getDate()
    if (dayOfMonth <= 5) {
      suggestions.push({
        type: 'wrapped',
        titre: '📊 Ton wrapped du mois',
        message: 'Découvre tes stats du mois précédent en un clic.',
        action_url: '/dashboard/wrapped',
        priority: 15,
      })
    }

    suggestions.sort((a, b) => b.priority - a.priority)

    return NextResponse.json({
      suggestions: suggestions.slice(0, 3),
      context: {
        hour,
        gratitudes_today: gratRes.count ?? 0,
        intention_today: !!intRes.data,
        breath_today: breathRes.count ?? 0,
        streak: giftRes.data?.streak_count ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
