/**
 * MOKSHA V7.1 — Tests unitaires insee.ts
 * Couvre : Luhn SIREN/SIRET + exception La Poste, format, TokenBucket, mapping formes juridiques.
 * Les tests d'intégration getSiret/getSiren (nécessitent Supabase + fetch) → F1.11 routes.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  isValidSiren,
  isValidSiret,
  formatSiren,
  formatSiret,
  __testables,
} from './insee'

const { TokenBucket, luhnCheck, labelFormeJuridique } = __testables

describe('formatSiren / formatSiret', () => {
  it('retire espaces et caractères non-numériques', () => {
    expect(formatSiren('732 829 320')).toBe('732829320')
    expect(formatSiret('120 027 016 00563')).toBe('12002701600563')
    expect(formatSiret('732-829-320-00074')).toBe('73282932000074')
  })

  it('préserve une chaîne déjà propre', () => {
    expect(formatSiren('732829320')).toBe('732829320')
    expect(formatSiret('12002701600563')).toBe('12002701600563')
  })

  it('retourne chaîne vide si aucun chiffre', () => {
    expect(formatSiren('abcdef')).toBe('')
    expect(formatSiret('---')).toBe('')
  })
})

describe('luhnCheck (algorithme Luhn standard)', () => {
  it('valide des SIREN réels connus', () => {
    expect(luhnCheck('732829320')).toBe(true) // Apple France
    expect(luhnCheck('120027016')).toBe(true) // INSEE elle-même
  })

  it('valide des SIRET réels connus', () => {
    expect(luhnCheck('73282932000074')).toBe(true) // Apple France siège
    expect(luhnCheck('12002701600563')).toBe(true) // INSEE siège
  })

  it('rejette les chaînes non-numériques', () => {
    expect(luhnCheck('abc123456')).toBe(false)
    expect(luhnCheck('12345678a')).toBe(false)
  })

  it('rejette des Luhn invalides', () => {
    expect(luhnCheck('123456789')).toBe(false)
    expect(luhnCheck('12345678901234')).toBe(false)
  })
})

describe('isValidSiren', () => {
  it('valide des SIREN Luhn-valides', () => {
    expect(isValidSiren('732829320')).toBe(true)
    expect(isValidSiren('120027016')).toBe(true)
  })

  it('rejette si longueur incorrecte', () => {
    expect(isValidSiren('12345678')).toBe(false) // 8 chiffres
    expect(isValidSiren('1234567890')).toBe(false) // 10 chiffres
    expect(isValidSiren('')).toBe(false)
  })

  it('accepte espaces puis valide Luhn', () => {
    expect(isValidSiren('732 829 320')).toBe(true)
    expect(isValidSiren('120 027 016')).toBe(true)
  })

  it('rejette Luhn invalide', () => {
    expect(isValidSiren('123456789')).toBe(false)
    expect(isValidSiren('000000000')).toBe(true) // cas limite : 000000000 passe Luhn (sum=0)
    expect(isValidSiren('111111111')).toBe(false)
  })
})

describe('isValidSiret (+ exception La Poste)', () => {
  it('valide des SIRET Luhn-valides standards', () => {
    expect(isValidSiret('73282932000074')).toBe(true)
    expect(isValidSiret('12002701600563')).toBe(true)
  })

  it('rejette longueur incorrecte', () => {
    expect(isValidSiret('1234567890123')).toBe(false)
    expect(isValidSiret('123456789012345')).toBe(false)
    expect(isValidSiret('')).toBe(false)
  })

  it('rejette SIRET standard avec Luhn invalide', () => {
    expect(isValidSiret('12345678901234')).toBe(false)
    expect(isValidSiret('73282932000075')).toBe(false) // dernier chiffre modifié
  })

  it('applique la règle La Poste (somme des 14 chiffres % 5 == 0)', () => {
    // La Poste : SIREN 356000000, règle = sum(digits) % 5 == 0
    // 35600000000060 : 3+5+6+0+0+0+0+0+0+0+0+0+6+0 = 20 → valide
    expect(isValidSiret('35600000000060')).toBe(true)
    // 35600000037713 : 3+5+6+0+0+0+0+0+0+3+7+7+1+3 = 35 → valide
    expect(isValidSiret('35600000037713')).toBe(true)
    // 35600000017717 : 3+5+6+0+0+0+0+0+0+1+7+7+1+7 = 37 → invalide (37%5=2)
    expect(isValidSiret('35600000017717')).toBe(false)
  })

  it('accepte espaces avant validation', () => {
    expect(isValidSiret('732 829 320 00074')).toBe(true)
    expect(isValidSiret('356 000 000 00060')).toBe(true)
  })

  it('cas limite : SIRET La Poste avec Luhn valide qui serait refusé par règle standard', () => {
    // SIRET 35600000037713 : sum%5=0 donc valide La Poste.
    // On vérifie que la règle La Poste PRIME sur Luhn (même si Luhn échoue).
    expect(isValidSiret('35600000037713')).toBe(true)
  })
})

describe('labelFormeJuridique', () => {
  it('mappe les formes principales MOKSHA', () => {
    expect(labelFormeJuridique('5710')).toBe('SAS')
    expect(labelFormeJuridique('5720')).toBe('SASU')
    expect(labelFormeJuridique('5498')).toBe('EURL')
    expect(labelFormeJuridique('5499')).toBe('SARL')
    expect(labelFormeJuridique('5410')).toBe('SARL')
    expect(labelFormeJuridique('6540')).toBe('SCI')
    expect(labelFormeJuridique('9220')).toBe('Association déclarée')
    expect(labelFormeJuridique('1000')).toBe('Entrepreneur individuel')
  })

  it('retourne fallback pour code inconnu', () => {
    expect(labelFormeJuridique('9999')).toBe('Catégorie juridique 9999')
    expect(labelFormeJuridique('0000')).toBe('Catégorie juridique 0000')
  })

  it('retourne "Non communiqué" si code vide/null', () => {
    expect(labelFormeJuridique('')).toBe('Non communiqué')
    expect(labelFormeJuridique(null)).toBe('Non communiqué')
    expect(labelFormeJuridique(undefined)).toBe('Non communiqué')
  })
})

describe('TokenBucket', () => {
  let bucket: InstanceType<typeof TokenBucket>

  beforeEach(() => {
    bucket = new TokenBucket(5, 60) // 5 jetons capacité, 60/min = 1/sec
  })

  it('commence plein', () => {
    expect(bucket.available()).toBeCloseTo(5, 0)
  })

  it('consomme des jetons sur take()', async () => {
    await bucket.take()
    await bucket.take()
    await bucket.take()
    expect(bucket.available()).toBeLessThanOrEqual(2.1)
    expect(bucket.available()).toBeGreaterThanOrEqual(1.9)
  })

  it('retourne true si jeton dispo immédiatement', async () => {
    const granted = await bucket.take()
    expect(granted).toBe(true)
  })

  it('attend refill si bucket vide mais maxWait OK', async () => {
    // Épuise le bucket (5 jetons)
    for (let i = 0; i < 5; i++) await bucket.take()
    // Au refill rate de 60/min = 1/sec, on attend ~1s pour le 6ème
    const t0 = Date.now()
    const granted = await bucket.take(3_000)
    const elapsed = Date.now() - t0
    expect(granted).toBe(true)
    expect(elapsed).toBeGreaterThanOrEqual(500) // a dû attendre au moins 500ms
    expect(elapsed).toBeLessThan(3_000)
  }, 10_000)

  it('retourne false si maxWait insuffisant', async () => {
    for (let i = 0; i < 5; i++) await bucket.take()
    const granted = await bucket.take(50) // 50ms insuffisant pour refill 1/sec
    expect(granted).toBe(false)
  })

  it('ne dépasse jamais la capacité au refill', async () => {
    // Bucket full au start
    await new Promise((r) => setTimeout(r, 1500)) // attend 1.5s sans consommer
    expect(bucket.available()).toBeLessThanOrEqual(5)
  }, 5_000)
})
