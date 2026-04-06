// MOKSHA — constants

export const APP_SCHEMA = 'moksha'
export const APP_NAME = 'MOKSHA'
export const APP_TAGLINE = 'Libère-toi. Crée ton empire en 10 minutes.'
export const APP_DESCRIPTION = 'Crée ton entreprise ou ton association en 10 minutes. Agent IA juridique, coffre-fort sécurisé, dépôt INPI automatique. Concurrent direct de LegalPlace.'
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

// Plans
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

// Stripe prices (price_ids à renseigner après création Stripe)
export const STRIPE_PRICES = {
  autopilote_mensuel: { price: 19, currency: 'EUR', interval: 'month' },
  autopilote_annuel: { price: 180, currency: 'EUR', interval: 'year' }, // 15€/mois
  pro_mensuel: { price: 49, currency: 'EUR', interval: 'month' },
  pro_annuel: { price: 468, currency: 'EUR', interval: 'year' }, // 39€/mois
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
