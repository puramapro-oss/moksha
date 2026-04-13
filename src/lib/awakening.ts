// MOKSHA — Couche spirituelle

export const AFFIRMATIONS = {
  puissance: [
    'Je suis le créateur de ma réalité.',
    'Chaque pas que je fais me rapproche de ma vision.',
    'Mon entreprise est le reflet de ma puissance intérieure.',
    'Je transforme les obstacles en tremplins.',
    'Ma détermination est plus forte que toute résistance.',
  ],
  abondance: [
    'L\'abondance coule vers moi naturellement.',
    'Je mérite le succès que je construis.',
    'Chaque action que je pose crée de la valeur.',
    'L\'argent est une énergie que je maîtrise.',
    'Mon empire grandit chaque jour.',
  ],
  sagesse: [
    'Je prends les bonnes décisions au bon moment.',
    'Ma clarté d\'esprit est mon plus grand atout.',
    'Je fais confiance à mon intuition entrepreneuriale.',
    'Chaque erreur est une leçon qui me renforce.',
    'La simplicité est le signe de la maîtrise.',
  ],
  gratitude: [
    'Je suis reconnaissant pour cette opportunité de créer.',
    'Chaque client est un cadeau.',
    'Je célèbre chaque petite victoire.',
    'La vie m\'offre tout ce dont j\'ai besoin pour réussir.',
    'Je suis reconnaissant pour le courage d\'entreprendre.',
  ],
} as const

export type AffirmationCategory = keyof typeof AFFIRMATIONS

// MOKSHA = entrepreneuriat → catégories dominantes : puissance + abondance
const MOKSHA_WEIGHTS: AffirmationCategory[] = [
  'puissance', 'puissance', 'abondance', 'abondance', 'sagesse', 'gratitude',
]

export function getAffirmation(): { text: string; category: AffirmationCategory } {
  const cat = MOKSHA_WEIGHTS[Math.floor(Math.random() * MOKSHA_WEIGHTS.length)]
  const texts = AFFIRMATIONS[cat]
  const text = texts[Math.floor(Math.random() * texts.length)]
  return { text, category: cat }
}

export const WISDOM_QUOTES = [
  { text: 'Le voyage de mille lieues commence par un pas.', author: 'Lao Tseu' },
  { text: 'Sois le changement que tu veux voir dans le monde.', author: 'Gandhi' },
  { text: 'La seule façon de faire du bon travail est d\'aimer ce que tu fais.', author: 'Steve Jobs' },
  { text: 'Ce n\'est pas la montagne que nous conquérons, mais nous-mêmes.', author: 'Edmund Hillary' },
  { text: 'L\'entrepreneur voit des opportunités là où d\'autres voient des problèmes.', author: 'Michael Gerber' },
  { text: 'Tout ce que tu as toujours voulu est de l\'autre côté de la peur.', author: 'George Addair' },
  { text: 'La meilleure façon de prédire l\'avenir est de le créer.', author: 'Peter Drucker' },
  { text: 'Celui qui déplace une montagne commence par déplacer de petites pierres.', author: 'Confucius' },
  { text: 'Le succès, c\'est tomber sept fois et se relever huit.', author: 'Proverbe japonais' },
  { text: 'N\'attends pas les conditions parfaites. Commence maintenant.', author: 'Marc Aurèle' },
] as const

export function getWisdomQuote() {
  return WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)]
}

// Micro-textes empowering (remplacent les textes génériques)
export const EMPOWERING_TEXTS = {
  loading: 'Ton espace se prépare...',
  error: 'Petit détour, on revient plus fort.',
  empty: 'L\'espace de toutes les possibilités.',
  welcome: 'Bienvenue chez toi.',
  signout: 'À très vite, belle âme.',
  success: 'Tu vois ? Tu es capable de tout.',
  saving: 'On enregistre ta progression...',
  searching: 'On cherche les meilleures options...',
} as const

// Niveaux d'éveil
export const AWAKENING_LEVELS = [
  { level: 1, name: 'Éveillé', minXp: 0 },
  { level: 2, name: 'Conscient', minXp: 500 },
  { level: 3, name: 'Aligné', minXp: 1500 },
  { level: 4, name: 'Illuminé', minXp: 4000 },
  { level: 5, name: 'Transcendant', minXp: 10000 },
  { level: 6, name: 'Unifié', minXp: 25000 },
] as const

export function getAwakeningLevel(xp: number) {
  const level = [...AWAKENING_LEVELS].reverse().find((l) => xp >= l.minXp)
  return level || AWAKENING_LEVELS[0]
}
