// MOKSHA — types

import type { Plan } from '@/lib/constants'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  referral_code: string
  referred_by: string | null
  jurisia_questions_today: number
  jurisia_reset_date: string
  is_admin: boolean
  is_super_admin: boolean
  tutorial_completed: boolean
  created_at: string
  updated_at: string
}

export type Structure = {
  id: string
  user_id: string
  type: 'entreprise' | 'association'
  forme: string | null
  denomination: string | null
  nom_commercial: string | null
  activite: string | null
  code_ape: string | null
  siren: string | null
  siret: string | null
  adresse_siege: string | null
  capital_social: number | null
  date_creation: string | null
  statut: 'brouillon' | 'en_cours' | 'depose' | 'accepte' | 'refuse' | 'regularisation'
  kbis_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Demarche = {
  id: string
  user_id: string
  structure_id: string | null
  type: 'creation' | 'modification' | 'cessation' | 'depot_comptes' | 'association'
  titre: string
  mode: 'standard' | 'express'
  statut: 'brouillon' | 'documents_generes' | 'en_traitement' | 'depose_inpi' | 'accepte' | 'refuse' | 'regularisation'
  wizard_data: Record<string, unknown>
  documents_generes: Array<{ nom: string; url?: string; type: string }>
  inpi_reference: string | null
  avancement: number
  date_depot: string | null
  date_acceptation: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type MokshaDocument = {
  id: string
  user_id: string
  structure_id: string | null
  demarche_id: string | null
  nom: string
  type: 'statuts' | 'pv' | 'kbis' | 'facture' | 'contrat' | 'identite' | 'domicile' | 'annonce_legale' | 'autre'
  file_url: string
  file_size: number | null
  mime_type: string | null
  version: number
  scanner_score: 'parfait' | 'attention' | 'illisible' | null
  scanner_details: Record<string, unknown>
  partage_token: string | null
  partage_expire: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type JurisIAConversation = {
  id: string
  user_id: string
  titre: string
  contexte: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type JurisIAMessage = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  sources: Array<{ label: string; url: string }>
  confiance: 'eleve' | 'moyen' | 'faible' | null
  created_at: string
}

export type Rappel = {
  id: string
  user_id: string
  structure_id: string | null
  type: 'ag_annuelle' | 'tva' | 'urssaf' | 'depot_comptes' | 'kbis_renouvellement' | 'echance_custom'
  titre: string
  description: string | null
  date_echeance: string
  statut: 'actif' | 'complete' | 'reporte' | 'ignore'
  notifie: boolean
  created_at: string
}

export type WalletTransaction = {
  id: string
  user_id: string
  type: 'commission' | 'bonus' | 'retrait' | 'concours'
  amount: number
  description: string | null
  statut: 'pending' | 'completed' | 'failed'
  stripe_payout_id: string | null
  created_at: string
}

export type Referral = {
  id: string
  referrer_id: string
  referee_id: string
  code_used: string
  statut: 'pending' | 'active' | 'paid'
  commission_amount: number
  created_at: string
}

// Points Purama
export type PointTransaction = {
  id: string
  user_id: string
  amount: number
  type: 'inscription' | 'parrainage' | 'streak' | 'partage' | 'feedback' | 'mission' | 'achievement' | 'daily_gift' | 'achat' | 'conversion'
  description: string | null
  created_at: string
}

export type DailyGift = {
  id: string
  user_id: string
  gift_type: 'points' | 'coupon' | 'ticket' | 'credits' | 'big_points' | 'mega_coupon'
  gift_value: string
  streak_count: number
  opened_at: string
}

// Concours
export type ContestEntry = {
  id: string
  user_id: string
  contest_type: 'classement' | 'tirage'
  period: string
  score: number
  rank: number | null
  amount_won: number | null
  created_at: string
}

export type LotteryTicket = {
  id: string
  user_id: string
  source: 'inscription' | 'parrainage' | 'mission' | 'partage' | 'streak' | 'abo' | 'achat_points'
  draw_id: string | null
  created_at: string
}

// Partage social
export type SocialShare = {
  id: string
  user_id: string
  share_code: string
  platform_hint: string | null
  points_given: number
  shared_at: string
}

// Feedback
export type UserFeedback = {
  id: string
  user_id: string
  rating: number
  comment: string | null
  category: 'general' | 'jurisia' | 'demarches' | 'proofvault' | 'wallet' | 'autre'
  points_given: number
  created_at: string
}

// Contact
export type ContactMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  sent_at: string
  responded: boolean
}

// Notification preferences
export type NotificationPreference = {
  id: string
  user_id: string
  type: string
  enabled: boolean
  frequency: 'low' | 'normal' | 'high'
  paused_until: string | null
}
