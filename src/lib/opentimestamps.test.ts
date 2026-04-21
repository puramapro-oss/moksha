/**
 * MOKSHA V7.1 — Tests unitaires opentimestamps.ts (F2.3)
 *
 * Tests rapides : hashContent déterministe + verifyContent gestion erreurs.
 * Tests live (stamp + verify Bitcoin) → uniquement si OTS_LIVE=1
 * (nécessitent réseau + ~30s).
 */

import { describe, it, expect } from 'vitest'
import { hashContent, verifyContent, upgradeProof } from './opentimestamps'

describe('hashContent', () => {
  it('SHA-256 déterministe', () => {
    expect(hashContent('hello')).toBe(hashContent('hello'))
  })

  it('SHA-256 connu pour chaîne vide', () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(hashContent('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('SHA-256 connu pour "abc"', () => {
    // SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    expect(hashContent('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('hash différent pour contenu différent', () => {
    expect(hashContent('foo')).not.toBe(hashContent('bar'))
  })

  it('UTF-8 — caractères français accentués', () => {
    // Vérifie l'encodage UTF-8 (pas ISO-8859)
    const h1 = hashContent('Élise — Frasne')
    const h2 = hashContent('Élise — Frasne')
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64)
  })

  it('format hex 64 caractères', () => {
    const h = hashContent('MOKSHA règlement v1.0')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('verifyContent — gestion erreurs', () => {
  it('preuve base64 invalide → verified=false avec error', async () => {
    const result = await verifyContent('hello', 'NOT_A_VALID_BASE64_!!!')
    expect(result.verified).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.pendingUpgrade).toBe(false)
  })

  it('preuve base64 valide mais bytes random → verified=false', async () => {
    const fakeBytes = Buffer.from('this-is-not-a-real-ots-proof').toString('base64')
    const result = await verifyContent('hello', fakeBytes)
    expect(result.verified).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('preuve vide → verified=false', async () => {
    const result = await verifyContent('hello', '')
    expect(result.verified).toBe(false)
  })
})

describe('upgradeProof — gestion erreurs', () => {
  it('preuve invalide → upgraded=false avec error', async () => {
    const result = await upgradeProof('hello', 'INVALID_BASE64')
    expect(result.upgraded).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('preuve vide → upgraded=false', async () => {
    const result = await upgradeProof('hello', '')
    expect(result.upgraded).toBe(false)
  })
})

// Tests live nécessitent réseau (calendar servers OpenTimestamps publics).
// Activer avec OTS_LIVE=1 npm test
const LIVE = process.env.OTS_LIVE === '1'
const liveTest = LIVE ? it : it.skip

describe('OpenTimestamps live (réseau, OTS_LIVE=1)', () => {
  liveTest('stamp + verify round-trip', async () => {
    const { stampContent } = await import('./opentimestamps')
    const content = `MOKSHA test ${Date.now()}`
    const stamp = await stampContent(content)
    expect(stamp.contentHash).toMatch(/^[0-9a-f]{64}$/)
    expect(stamp.proof).toBeTruthy()
    expect(stamp.pendingBitcoin).toBe(true)
    // Vérification immédiate : preuve pas encore ancrée Bitcoin → pendingUpgrade=true
    const verify = await verifyContent(content, stamp.proof)
    expect(verify.verified).toBe(false)
    expect(verify.pendingUpgrade).toBe(true)
  }, 60_000)
})
