/**
 * MOKSHA V4 — Bourses Asso inclusion (dual circuit strict)
 * Source of truth: ~/purama/STRIPE_CONNECT_KARMA_V4.md §Bourse Asso
 *
 * Règle d'or: SASU finance primes, Asso finance bourses.
 * Bourse déclenchée après 5 missions citoyennes vérifiées.
 * Financement exclusif par subventions (Afnic, FDJ, FDF, Orange, Cetelem, FDVA, etc.).
 */

export type ProfilSocial =
  | 'caf'
  | 'rural'
  | 'jeune'
  | 'senior'
  | 'demandeur_emploi'
  | 'etudiant'
  | 'handicap'

export const PROFIL_LABELS: Record<ProfilSocial, { label: string; montant: number; icon: string }> = {
  caf: { label: 'Bénéficiaire CAF / RSA', montant: 200, icon: '🏛️' },
  rural: { label: 'Ruralité (ZFRR / ZRR / <10k hab)', montant: 150, icon: '🌾' },
  jeune: { label: 'Jeune 16-25 ans', montant: 100, icon: '🌱' },
  senior: { label: 'Senior 65+', montant: 100, icon: '👵' },
  demandeur_emploi: { label: 'Demandeur d\'emploi', montant: 150, icon: '📋' },
  etudiant: { label: 'Étudiant', montant: 100, icon: '🎓' },
  handicap: { label: 'Situation de handicap', montant: 200, icon: '♿' },
}

export function computeBourseMontant(profils: ProfilSocial[]): number {
  if (profils.length === 0) return 0
  // Prend le max (cumul non permis — 1 bourse par user)
  return Math.max(...profils.map((p) => PROFIL_LABELS[p].montant))
}

export interface MissionCitoyenne {
  slug: string
  title: string
  category: 'sante' | 'ecologie' | 'education' | 'inclusion'
  verification: 'peer_validation' | 'url_proof' | 'geo_photo' | 'manual_admin'
  description: string
  icon: string
}

export const MISSIONS_CITOYENNES: MissionCitoyenne[] = [
  {
    slug: 'plant-arbre',
    title: 'Planter un arbre dans ma commune',
    category: 'ecologie',
    verification: 'geo_photo',
    description: 'Photo de l\'arbre planté avec géolocalisation (parc public, forêt, terrain associatif).',
    icon: '🌳',
  },
  {
    slug: 'visite-ehpad',
    title: 'Visiter 1 résident EHPAD (2h)',
    category: 'inclusion',
    verification: 'peer_validation',
    description: 'Preuve: photo + signature du personnel d\'accueil ou résident avec autorisation.',
    icon: '🤝',
  },
  {
    slug: 'ramassage-dechets',
    title: 'Ramassage de déchets (3h)',
    category: 'ecologie',
    verification: 'geo_photo',
    description: 'Photo avant/après + géoloc. Minimum 3 sacs (~20kg).',
    icon: '♻️',
  },
  {
    slug: 'atelier-jeunes',
    title: 'Animer un atelier pour jeunes (1h)',
    category: 'education',
    verification: 'peer_validation',
    description: 'Association, MJC, centre social. Attestation du responsable.',
    icon: '📚',
  },
  {
    slug: 'don-alimentaire',
    title: 'Don alimentaire (banque / Restos du cœur)',
    category: 'inclusion',
    verification: 'url_proof',
    description: 'Reçu ou photo du don. Minimum 20€ ou équivalent.',
    icon: '🥖',
  },
  {
    slug: 'aide-numerique',
    title: 'Aider un senior avec le numérique (1h)',
    category: 'inclusion',
    verification: 'peer_validation',
    description: 'Accompagnement démarche CAF, ameli, santé. Attestation + photo.',
    icon: '💻',
  },
  {
    slug: 'temoignage-video',
    title: 'Témoignage vidéo parcours entrepreneur',
    category: 'education',
    verification: 'url_proof',
    description: 'Vidéo 60-120s publiée sur YouTube ou Instagram avec #PuramaInclusion.',
    icon: '🎬',
  },
  {
    slug: 'mentorat-jeune',
    title: 'Mentorat d\'un jeune entrepreneur (30j)',
    category: 'education',
    verification: 'peer_validation',
    description: 'Engagement 1h/semaine pendant 30 jours. Témoignage mutuel signé.',
    icon: '🧭',
  },
  {
    slug: 'commerce-local',
    title: 'Mettre en avant un commerce local',
    category: 'inclusion',
    verification: 'url_proof',
    description: 'Publication réseaux sociaux d\'un artisan / producteur local avec coordonnées.',
    icon: '🏪',
  },
  {
    slug: 'formation-gratuite',
    title: 'Donner une formation gratuite (2h)',
    category: 'education',
    verification: 'peer_validation',
    description: 'Session en ligne ou présentiel. Min 3 participants. Lien enregistrement ou attestation.',
    icon: '👨‍🏫',
  },
]

export function getMissionBySlug(slug: string): MissionCitoyenne | null {
  return MISSIONS_CITOYENNES.find((m) => m.slug === slug) ?? null
}

/**
 * Subventions disponibles pour financer les bourses Asso (renouvelables annuellement).
 */
export const SUBVENTION_SOURCES = [
  { key: 'subvention_afnic', label: 'Afnic', amount: 15000, renouvelable: true },
  { key: 'subvention_fdj', label: 'FDJ', amount: 15000, renouvelable: true },
  { key: 'subvention_fdf', label: 'Fondation de France', amount: 15000, renouvelable: true },
  { key: 'subvention_orange', label: 'Orange Solidarité', amount: 15000, renouvelable: true },
  { key: 'subvention_cetelem', label: 'Cetelem', amount: 10000, renouvelable: true },
  { key: 'subvention_fdva', label: 'FDVA 2', amount: 8000, renouvelable: true },
  { key: 'subvention_anct', label: 'ANCT France Numérique Ensemble', amount: 5000, renouvelable: true },
  { key: 'subvention_fse', label: 'FSE+', amount: 0, renouvelable: false },
  { key: 'subvention_bpifrance', label: 'Bpifrance Inclusion', amount: 0, renouvelable: false },
  { key: 'subvention_region', label: 'Région Bourgogne-Franche-Comté', amount: 3000, renouvelable: true },
  { key: 'subvention_commune', label: 'Commune de Frasne', amount: 1000, renouvelable: true },
  { key: 'subvention_autre', label: 'Autre subvention', amount: 0, renouvelable: false },
] as const
