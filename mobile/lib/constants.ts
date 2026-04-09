export const APP_NAME = 'MOKSHA'
export const APP_TAGLINE = 'Libere-toi. Cree ton empire en 10 minutes.'
export const APP_URL = 'https://moksha.purama.dev'
export const SUPER_ADMIN_EMAIL = 'matiss.frasne@gmail.com'

export const COLORS = {
  primary: '#FF6B35',
  secondary: '#FFD700',
  accent: '#5DCAA5',
  bg: '#070B18',
  card: '#0D1225',
  surface: '#141A2E',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
} as const

export type Plan = 'gratuit' | 'autopilote' | 'pro'

export const PLAN_LIMITS: Record<Plan, { jurisiaPerDay: number; proofvaultMo: number; structures: number }> = {
  gratuit: { jurisiaPerDay: 3, proofvaultMo: 500, structures: 1 },
  autopilote: { jurisiaPerDay: 9999, proofvaultMo: 999999, structures: 3 },
  pro: { jurisiaPerDay: 9999, proofvaultMo: 999999, structures: 9999 },
}

export const PLAN_LABEL: Record<Plan, string> = {
  gratuit: 'Gratuit',
  autopilote: 'Autopilote',
  pro: 'Pro',
}

export const REFERRAL_PREFIX = 'MOKSHA-'
export const WALLET_MIN_WITHDRAWAL = 20

export const FORMES_JURIDIQUES = [
  { id: 'sasu', label: 'SASU', description: 'Societe par actions simplifiee unipersonnelle', icon: '👤' },
  { id: 'sas', label: 'SAS', description: 'Societe par actions simplifiee', icon: '👥' },
  { id: 'sarl', label: 'SARL', description: 'Societe a responsabilite limitee', icon: '🏢' },
  { id: 'eurl', label: 'EURL', description: 'Entreprise unipersonnelle a responsabilite limitee', icon: '🔑' },
  { id: 'sci', label: 'SCI', description: 'Societe civile immobiliere', icon: '🏠' },
  { id: 'micro', label: 'Micro-entreprise', description: 'Regime simplifie, ideal pour demarrer seul', icon: '🚀' },
] as const

export const TYPES_ASSOCIATIONS = [
  { id: 'culturelle', label: 'Culturelle', icon: '🎭', description: 'Art, musique, patrimoine, theatre' },
  { id: 'sportive', label: 'Sportive', icon: '⚽', description: 'Club, equipe, evenements' },
  { id: 'humanitaire', label: 'Humanitaire', icon: '🤝', description: 'Aide, solidarite, caritatif' },
  { id: 'education', label: 'Education', icon: '📚', description: 'Formation, soutien scolaire, recherche' },
  { id: 'environnement', label: 'Environnement', icon: '🌱', description: 'Ecologie, protection nature' },
  { id: 'autre', label: 'Autre', icon: '✨', description: 'Personnalise selon votre projet' },
] as const

export const POINTS_REWARDS = {
  inscription: 100,
  parrainage: 200,
  streak_daily: 10,
  partage: 300,
  max_partage_jour: 3,
  feedback: 200,
  achievement: 500,
  daily_gift_min: 5,
  daily_gift_max: 100,
  premier_jour: 100,
} as const
