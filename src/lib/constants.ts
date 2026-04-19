// MOKSHA — constants

export const APP_SCHEMA = 'moksha'
export const APP_NAME = 'MOKSHA'
export const APP_TAGLINE = 'Libère-toi. Crée ton empire en 10 minutes.'
export const APP_DESCRIPTION = 'Crée ton entreprise ou ton association en 10 minutes. Agent IA juridique, coffre-fort sécurisé, dépôt INPI automatique.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moksha.purama.dev'
export const SUPER_ADMIN_EMAIL = 'matiss.frasne@gmail.com'

// Colors
export const COLORS = {
  primary: '#FF6B35', // feu
  secondary: '#FFD700', // or
  accent: '#5DCAA5', // vert
  bg: '#070B18',
  card: '#0D1225',
  gradient: 'linear-gradient(135deg, #FF6B35, #FFD700)',
} as const

// Referral
export const REFERRAL_PREFIX = 'MOKSHA-'
export const REFERRAL_FIRST_MONTH_DISCOUNT = 0.5 // 50%
export const REFERRAL_RECURRING_PERCENT = 0.1 // 10%
export const WALLET_MIN_WITHDRAWAL = 20

// Plans — V4 STRIPE_CONNECT_KARMA_V4
// Premium = plan unique actif (29,99€/mois). Autopilote/Pro = legacy grandfather (anciens abonnés conservés).
export type Plan = 'gratuit' | 'premium' | 'autopilote' | 'pro'

export const PLAN_LIMITS: Record<Plan, { jurisiaPerDay: number; proofvaultMo: number; structures: number }> = {
  gratuit: { jurisiaPerDay: 3, proofvaultMo: 500, structures: 1 },
  premium: { jurisiaPerDay: 9999, proofvaultMo: 999999, structures: 9999 },
  autopilote: { jurisiaPerDay: 9999, proofvaultMo: 999999, structures: 3 },
  pro: { jurisiaPerDay: 9999, proofvaultMo: 999999, structures: 9999 },
}

export const PLAN_LABEL: Record<Plan, string> = {
  gratuit: 'Gratuit',
  premium: 'Premium',
  autopilote: 'Autopilote (legacy)',
  pro: 'Pro (legacy)',
}

export const LEGACY_PLANS = new Set<Plan>(['autopilote', 'pro'])
export const ACTIVE_PLAN: Exclude<Plan, 'gratuit'> = 'premium'

// Stripe prices V4 — 29,99€/mois (création d'entreprise premium) + coupon ANNUAL_20 (-20%)
export const STRIPE_PRICES = {
  premium_mensuel: { price: 29.99, currency: 'EUR', interval: 'month' },
  premium_annuel: { price: 287.9, currency: 'EUR', interval: 'year' }, // 29,99 × 12 × 0,80
  // Legacy (grandfather) — plus affichés mais utilisés pour stats
  autopilote_mensuel: { price: 19, currency: 'EUR', interval: 'month' },
  autopilote_annuel: { price: 180, currency: 'EUR', interval: 'year' },
  pro_mensuel: { price: 49, currency: 'EUR', interval: 'month' },
  pro_annuel: { price: 468, currency: 'EUR', interval: 'year' },
  express_addon: { price: 50, currency: 'EUR', interval: 'one_time' },
} as const

// Formes juridiques entreprise
export const FORMES_JURIDIQUES = [
  { id: 'sasu', label: 'SASU', description: 'Société par actions simplifiée unipersonnelle', icon: '👤' },
  { id: 'sas', label: 'SAS', description: 'Société par actions simplifiée', icon: '👥' },
  { id: 'sarl', label: 'SARL', description: 'Société à responsabilité limitée', icon: '🏢' },
  { id: 'eurl', label: 'EURL', description: 'Entreprise unipersonnelle à responsabilité limitée', icon: '🔑' },
  { id: 'sci', label: 'SCI', description: 'Société civile immobilière', icon: '🏠' },
  { id: 'micro', label: 'Micro-entreprise', description: 'Régime simplifié, idéal pour démarrer seul', icon: '🚀' },
] as const

// Types associations loi 1901
export const TYPES_ASSOCIATIONS = [
  { id: 'culturelle', label: 'Culturelle', icon: '🎭', description: 'Art, musique, patrimoine, théâtre' },
  { id: 'sportive', label: 'Sportive', icon: '⚽', description: 'Club, équipe, événements' },
  { id: 'humanitaire', label: 'Humanitaire', icon: '🤝', description: 'Aide, solidarité, caritatif' },
  { id: 'education', label: 'Éducation', icon: '📚', description: 'Formation, soutien scolaire, recherche' },
  { id: 'environnement', label: 'Environnement', icon: '🌱', description: 'Écologie, protection nature' },
  { id: 'autre', label: 'Autre', icon: '✨', description: 'Personnalisé selon votre projet' },
] as const

// Milestones parrainage
export const REFERRAL_MILESTONES = [
  { filleuls: 5, bonus: 50, label: 'Éclaireur' },
  { filleuls: 10, bonus: 150, label: 'Allié' },
  { filleuls: 25, bonus: 500, label: 'Ambassadeur' },
  { filleuls: 50, bonus: 1500, label: 'Champion' },
  { filleuls: 100, bonus: 5000, label: 'Légende' },
  { filleuls: 500, bonus: 25000, label: 'Titan' },
  { filleuls: 1000, bonus: 50000, label: 'Éternel' },
] as const

// Company info
export const COMPANY_INFO = {
  name: 'SASU PURAMA',
  siret: '93876543200018',
  address: '8 Rue de la Chapelle',
  zip: '25560',
  city: 'Frasne',
  country: 'France',
  tva: 'Art. 293B CGI — TVA non applicable',
  rcs: 'RCS Besançon',
  contact: 'matiss.frasne@gmail.com',
  dpo: 'matiss.frasne@gmail.com',
  asso_percentage: 10,
} as const

// Points Purama
export const POINTS_VALUE = 0.01 // 1pt = 0.01€
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

export const POINTS_SHOP = [
  { id: 'reduction_10', label: '-10% sur votre prochain mois', cost: 1000, type: 'reduction' as const },
  { id: 'reduction_30', label: '-30% sur votre prochain mois', cost: 3000, type: 'reduction' as const },
  { id: 'reduction_50', label: '-50% sur votre prochain mois', cost: 5000, type: 'reduction' as const },
  { id: 'mois_gratuit', label: '1 mois GRATUIT', cost: 10000, type: 'subscription' as const },
  { id: 'ticket_tirage', label: '1 ticket tirage mensuel', cost: 500, type: 'ticket' as const },
  { id: 'cash_1', label: '1€ en wallet', cost: 10000, type: 'cash' as const },
] as const

// Daily Gift distribution (% chances)
export const DAILY_GIFT_CHANCES = {
  points_small: 40, // 5-20 pts
  coupon_small: 25, // -5% ou -10% (7j)
  ticket: 15,       // 1 ticket tirage
  credits: 10,      // +3 credits JurisIA
  points_big: 5,    // -20% (3j)
  coupon_big: 3,    // 50-100 pts
  mega_coupon: 2,   // -50% (24h)
} as const

// Concours
export const CONTEST_WEEKLY_POOL_PERCENT = 0.06 // 6% CA
export const CONTEST_MONTHLY_POOL_PERCENT = 0.04 // 4% CA
export const CONTEST_WEEKLY_DISTRIBUTION = [0.02, 0.01, 0.007, 0.005, 0.004, 0.003, 0.00275, 0.00275, 0.00275, 0.00275] as const
export const CONTEST_MONTHLY_DISTRIBUTION = [0.012, 0.008, 0.006, 0.004, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002] as const

// Streak multiplier
export const STREAK_MULTIPLIER = [
  { min: 1, max: 6, multiplier: 1 },
  { min: 7, max: 13, multiplier: 2 },
  { min: 14, max: 29, multiplier: 3 },
  { min: 30, max: 59, multiplier: 5 },
  { min: 60, max: 99, multiplier: 7 },
  { min: 100, max: Infinity, multiplier: 10 },
] as const

// Codes APE (courants)
export const CODES_APE = [
  { code: '62.01Z', label: 'Programmation informatique' },
  { code: '62.02A', label: 'Conseil en systèmes informatiques' },
  { code: '63.12Z', label: 'Portails Internet' },
  { code: '70.22Z', label: 'Conseil pour les affaires et gestion' },
  { code: '73.11Z', label: 'Activités des agences de publicité' },
  { code: '74.10Z', label: 'Activités spécialisées de design' },
  { code: '74.20Z', label: 'Activités photographiques' },
  { code: '85.59A', label: "Formation continue d'adultes" },
  { code: '47.91A', label: 'Vente à distance sur catalogue général' },
  { code: '47.91B', label: 'Vente à distance spécialisée' },
  { code: '56.10A', label: 'Restauration traditionnelle' },
  { code: '96.02A', label: 'Coiffure' },
  { code: '96.04Z', label: 'Entretien corporel' },
  { code: '43.34Z', label: 'Travaux de peinture et vitrerie' },
  { code: '81.21Z', label: 'Nettoyage courant des bâtiments' },
] as const
