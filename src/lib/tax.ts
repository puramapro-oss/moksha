/**
 * MOKSHA V4 — Tax Assistant (4 profils fiscaux auto-détectés)
 * Source of truth: ~/purama/STRIPE_CONNECT_KARMA_V4.md §Tax Assistant
 */

export type TaxProfileType =
  | 'particulier_occasionnel'
  | 'particulier_bnc'
  | 'autoentrepreneur'
  | 'entreprise'

export const TAX_THRESHOLD_OCCASIONAL_EUR = Number(process.env.TAX_THRESHOLD_OCCASIONAL_EUR ?? '305')
export const TAX_THRESHOLD_BNC_MICRO_EUR = Number(process.env.TAX_THRESHOLD_BNC_MICRO_EUR ?? '77700')
export const TAX_THRESHOLD_BIC_MICRO_EUR = Number(process.env.TAX_THRESHOLD_BIC_MICRO_EUR ?? '188700')
export const TAX_THRESHOLD_TVA_FRANCHISE_EUR = Number(process.env.TAX_THRESHOLD_TVA_FRANCHISE_EUR ?? '36800')

export interface TaxProfileDefinition {
  type: TaxProfileType
  label: string
  shortLabel: string
  description: string
  whenToChoose: string
  retraitMessage: string
  declaration: string
  icon: string
}

export const TAX_PROFILES: Record<TaxProfileType, TaxProfileDefinition> = {
  particulier_occasionnel: {
    type: 'particulier_occasionnel',
    label: 'Particulier (je gagne occasionnellement)',
    shortLabel: 'Occasionnel',
    description: 'Je reçois des petits montants ponctuels (<305€/an).',
    whenToChoose: 'Idéal si tu débutes ou ne dépasses pas 305€/an cumulés.',
    retraitMessage: '✅ Revenus occasionnels <305€/an — aucune déclaration requise.',
    declaration: 'Aucune déclaration tant que tu restes sous 305€/an.',
    icon: '🌱',
  },
  particulier_bnc: {
    type: 'particulier_bnc',
    label: 'Particulier avec revenus BNC (305€ à 77 700€/an)',
    shortLabel: 'BNC',
    description: 'Je déclare mes gains via la 2042-C-PRO (abattement 34% auto).',
    whenToChoose: 'Recommandé entre 305€ et 77 700€/an de cumul.',
    retraitMessage: '💡 Ta déclaration 2042-C-PRO est prête chaque mars — 10 secondes à valider.',
    declaration: 'Case 5NG/5KU pré-remplie automatiquement par Purama.',
    icon: '📄',
  },
  autoentrepreneur: {
    type: 'autoentrepreneur',
    label: 'Autoentrepreneur (SIRET actif)',
    shortLabel: 'AE',
    description: 'Purama déclare auto à l\'URSSAF via Tierce Déclaration.',
    whenToChoose: 'Recommandé au-dessus de 3 000€/an ou si tu as déjà un SIRET.',
    retraitMessage: '✅ Purama a déclaré à l\'URSSAF — cotisations prélevées automatiquement.',
    declaration: 'Déclarations trimestrielles + cotisations URSSAF 100% auto après mandat.',
    icon: '🚀',
  },
  entreprise: {
    type: 'entreprise',
    label: 'Entreprise (SASU, SARL, asso...)',
    shortLabel: 'Entreprise',
    description: 'Factur-X auto + connexion Pennylane (TVA calculée).',
    whenToChoose: 'Obligatoire au-dessus de 77 700€/an ou si tu as une société.',
    retraitMessage: '✅ Factur-X envoyée à Pennylane — TVA calculée automatiquement.',
    declaration: 'Factur-X XML CII + PDF/A-3 joint à chaque payout, EDI-TDFC si besoin.',
    icon: '🏢',
  },
}

/**
 * Recommande un profil fiscal selon le cumul annuel de gains.
 * Appelé à chaque franchissement de seuil pour alertes escalade.
 */
export function recommendProfileFromEarnings(yearlyEur: number): TaxProfileType {
  if (yearlyEur < TAX_THRESHOLD_OCCASIONAL_EUR) return 'particulier_occasionnel'
  if (yearlyEur < 3000) return 'particulier_bnc'
  if (yearlyEur < TAX_THRESHOLD_BNC_MICRO_EUR) return 'autoentrepreneur'
  return 'entreprise'
}

export function getRetraitMessage(profile: TaxProfileType | null): string {
  if (!profile) return 'Complète ton profil fiscal pour que Purama déclare à ta place.'
  return TAX_PROFILES[profile].retraitMessage
}

/**
 * SIRET = 14 chiffres. SIREN = 9 chiffres (premiers du SIRET).
 */
export function validateSiret(siret: string): boolean {
  const clean = siret.replace(/\s+/g, '')
  if (!/^\d{14}$/.test(clean)) return false
  // Algorithme de Luhn
  let total = 0
  for (let i = 0; i < 14; i++) {
    const digit = Number.parseInt(clean.charAt(i), 10)
    const weight = i % 2 === 0 ? 1 : 2
    const product = digit * weight
    total += product > 9 ? product - 9 : product
  }
  return total % 10 === 0
}

export function extractSiren(siret: string): string | null {
  const clean = siret.replace(/\s+/g, '')
  if (!validateSiret(clean)) return null
  return clean.slice(0, 9)
}

export interface ThresholdAlert {
  level: 'info' | 'warning' | 'critical'
  threshold: number
  message: string
  action: string
}

/**
 * Retourne l'alerte à afficher selon le cumul annuel et le profil actuel.
 */
export function computeThresholdAlert(params: {
  yearlyEur: number
  currentProfile: TaxProfileType | null
  alerted: { threshold_305: boolean; threshold_bnc: boolean; threshold_tva: boolean }
}): ThresholdAlert | null {
  const { yearlyEur, currentProfile, alerted } = params

  if (yearlyEur >= 1500 && yearlyEur < 2500 && currentProfile === 'particulier_occasionnel' && !alerted.threshold_305) {
    return {
      level: 'info',
      threshold: 1500,
      message: `Tu as gagné ${yearlyEur.toFixed(2)}€ cette année. Au-delà de 3 000€, tu devras déclarer.`,
      action: 'Aucune action pour l\'instant.',
    }
  }
  if (yearlyEur >= 2500 && yearlyEur < 3000 && !alerted.threshold_305) {
    return {
      level: 'warning',
      threshold: 2500,
      message: `Plus que ${(3000 - yearlyEur).toFixed(2)}€ avant le seuil de déclaration.`,
      action: 'Prépare-toi : impots.gouv.fr → case 5NG → montant Purama.',
    }
  }
  if (yearlyEur >= 3000 && !alerted.threshold_bnc) {
    return {
      level: 'critical',
      threshold: 3000,
      message: `Tu dois déclarer tes ${yearlyEur.toFixed(2)}€ de gains Purama.`,
      action: 'Abattement 34% auto = imposé sur 66%. Purama t\'envoie ton récapitulatif PDF en janvier.',
    }
  }
  if (yearlyEur >= TAX_THRESHOLD_TVA_FRANCHISE_EUR && currentProfile === 'autoentrepreneur' && !alerted.threshold_tva) {
    return {
      level: 'warning',
      threshold: TAX_THRESHOLD_TVA_FRANCHISE_EUR,
      message: `Tu dépasses le seuil de franchise TVA (${TAX_THRESHOLD_TVA_FRANCHISE_EUR}€).`,
      action: 'Tu dois facturer la TVA dès maintenant. Pennylane recommandé.',
    }
  }
  return null
}
