// MOKSHA — Ligues (tiers classement)

export type Ligue = {
  key: string
  name: string
  minScore: number
  color: string
  emoji: string
}

export const LIGUES: Ligue[] = [
  { key: 'bronze', name: 'Bronze', minScore: 0, color: '#CD7F32', emoji: '🥉' },
  { key: 'argent', name: 'Argent', minScore: 50, color: '#C0C0C0', emoji: '🥈' },
  { key: 'or', name: 'Or', minScore: 150, color: '#FFD700', emoji: '🥇' },
  { key: 'platine', name: 'Platine', minScore: 400, color: '#E5E4E2', emoji: '💎' },
  { key: 'diamant', name: 'Diamant', minScore: 1000, color: '#B9F2FF', emoji: '💠' },
  { key: 'rubis', name: 'Rubis', minScore: 2500, color: '#E0115F', emoji: '♦️' },
  { key: 'emeraude', name: 'Émeraude', minScore: 5000, color: '#50C878', emoji: '💚' },
  { key: 'obsidienne', name: 'Obsidienne', minScore: 10000, color: '#3D3D3D', emoji: '⚫' },
  { key: 'cosmique', name: 'Cosmique', minScore: 25000, color: '#7C3AED', emoji: '🌌' },
  { key: 'purama', name: 'Purama', minScore: 50000, color: '#FF6B35', emoji: '🔥' },
]

export function getLigue(score: number): Ligue {
  return [...LIGUES].reverse().find((l) => score >= l.minScore) ?? LIGUES[0]
}

export function nextLigue(score: number): Ligue | null {
  return LIGUES.find((l) => l.minScore > score) ?? null
}
