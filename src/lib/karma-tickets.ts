/**
 * MOKSHA V4 — KARMA Tickets (18 façons gagner, multiplicateur ×5 abonné)
 * Source of truth: ~/purama/STRIPE_CONNECT_KARMA_V4.md §Système KARMA
 *
 * Règle ANJ: abonnement JAMAIS obligatoire. Multiplicateur ×5 est un bonus pour payants.
 * Participation gratuite obligatoire pour rester hors champ ANJ.
 */

export type TicketSource =
  | 'inscription'
  | 'parrainage_parrain'
  | 'parrainage_filleul'
  | 'mission'
  | 'avis_app_store'
  | 'avis_play_store'
  | 'follow_insta'
  | 'follow_tiktok'
  | 'follow_youtube'
  | 'story_insta'
  | 'story_tiktok'
  | 'video_tiktok'
  | 'video_reels'
  | 'partage_evolution'
  | 'partage_parrainage'
  | 'challenge_won'
  | 'streak_7j'
  | 'streak_30j'
  | 'feedback'
  | 'abonne_x5_multiplicateur'

export type DrawType = 'week' | 'month' | 'jackpot_terre'

export interface TicketRule {
  source: TicketSource
  label: string
  description: string
  week: number // tickets attribués au pool hebdo
  month: number // tickets attribués au pool mensuel
  jackpot?: number // tickets attribués au Jackpot Terre
  maxPerDay?: number
  requiresProof: boolean
}

export const TICKET_RULES: Record<TicketSource, TicketRule> = {
  inscription: { source: 'inscription', label: 'Inscription MOKSHA', description: '+1 ticket semaine + 1 ticket mois', week: 1, month: 1, requiresProof: false },
  parrainage_parrain: { source: 'parrainage_parrain', label: 'Parrain — filleul inscrit', description: '+2 tickets (semaine + mois)', week: 1, month: 1, requiresProof: false },
  parrainage_filleul: { source: 'parrainage_filleul', label: 'Filleul — inscription via lien', description: '+2 tickets (semaine + mois)', week: 1, month: 1, requiresProof: false },
  mission: { source: 'mission', label: 'Mission complétée', description: '+1 ticket', week: 1, month: 0, requiresProof: true },
  avis_app_store: { source: 'avis_app_store', label: 'Avis App Store', description: '+3 tickets semaine', week: 3, month: 0, requiresProof: true, maxPerDay: 1 },
  avis_play_store: { source: 'avis_play_store', label: 'Avis Play Store', description: '+3 tickets semaine', week: 3, month: 0, requiresProof: true, maxPerDay: 1 },
  follow_insta: { source: 'follow_insta', label: 'Follow Instagram', description: '+1 ticket', week: 1, month: 0, requiresProof: true, maxPerDay: 1 },
  follow_tiktok: { source: 'follow_tiktok', label: 'Follow TikTok', description: '+1 ticket', week: 1, month: 0, requiresProof: true, maxPerDay: 1 },
  follow_youtube: { source: 'follow_youtube', label: 'Follow YouTube', description: '+1 ticket', week: 1, month: 0, requiresProof: true, maxPerDay: 1 },
  story_insta: { source: 'story_insta', label: 'Story Instagram', description: '+1 ticket', week: 1, month: 0, requiresProof: true, maxPerDay: 1 },
  story_tiktok: { source: 'story_tiktok', label: 'Story TikTok', description: '+1 ticket', week: 1, month: 0, requiresProof: true, maxPerDay: 1 },
  video_tiktok: { source: 'video_tiktok', label: 'Vidéo TikTok', description: '+2 tickets', week: 2, month: 0, requiresProof: true, maxPerDay: 1 },
  video_reels: { source: 'video_reels', label: 'Vidéo Reels', description: '+2 tickets', week: 2, month: 0, requiresProof: true, maxPerDay: 1 },
  partage_evolution: { source: 'partage_evolution', label: 'Partage évolution', description: '+1 ticket (max 3/j)', week: 1, month: 0, requiresProof: false, maxPerDay: 3 },
  partage_parrainage: { source: 'partage_parrainage', label: 'Partage parrainage', description: '+1 ticket (max 3/j)', week: 1, month: 0, requiresProof: false, maxPerDay: 3 },
  challenge_won: { source: 'challenge_won', label: 'Challenge gagné', description: '+2 tickets', week: 2, month: 0, requiresProof: false },
  streak_7j: { source: 'streak_7j', label: 'Streak 7 jours', description: '+1 ticket', week: 1, month: 0, requiresProof: false },
  streak_30j: { source: 'streak_30j', label: 'Streak 30 jours', description: '+5 tickets', week: 0, month: 5, requiresProof: false },
  feedback: { source: 'feedback', label: 'Feedback in-app', description: '+1 ticket', week: 1, month: 0, requiresProof: false, maxPerDay: 1 },
  abonne_x5_multiplicateur: { source: 'abonne_x5_multiplicateur', label: 'Abonné (×5)', description: 'Multiplicateur sur tickets gagnés', week: 0, month: 0, requiresProof: false },
}

export function getCurrentDrawPeriod(type: DrawType): string {
  const now = new Date()
  if (type === 'week') {
    // ISO week format: 2026-W17
    const firstJan = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now.getTime() - firstJan.getTime()) / (24 * 3600 * 1000))
    const week = Math.ceil((days + firstJan.getDay() + 1) / 7)
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
  }
  if (type === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
  return `jackpot_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export interface TicketInsert {
  user_id: string
  source: TicketSource
  draw_period: string
  draw_type: DrawType
  multiplier: number
}

/**
 * Génère les inserts tickets pour une source donnée, en appliquant le multiplicateur ×5
 * si l'utilisateur est abonné payant.
 */
export function buildTicketInserts(
  userId: string,
  source: TicketSource,
  isPayingSubscriber: boolean,
): TicketInsert[] {
  const rule = TICKET_RULES[source]
  const multiplier = isPayingSubscriber ? 5 : 1
  const inserts: TicketInsert[] = []

  if (rule.week > 0) {
    for (let i = 0; i < rule.week; i++) {
      inserts.push({
        user_id: userId,
        source,
        draw_period: getCurrentDrawPeriod('week'),
        draw_type: 'week',
        multiplier,
      })
    }
  }
  if (rule.month > 0) {
    for (let i = 0; i < rule.month; i++) {
      inserts.push({
        user_id: userId,
        source,
        draw_period: getCurrentDrawPeriod('month'),
        draw_type: 'month',
        multiplier,
      })
    }
  }
  if (rule.jackpot && rule.jackpot > 0) {
    for (let i = 0; i < rule.jackpot; i++) {
      inserts.push({
        user_id: userId,
        source,
        draw_period: getCurrentDrawPeriod('jackpot_terre'),
        draw_type: 'jackpot_terre',
        multiplier,
      })
    }
  }
  return inserts
}
