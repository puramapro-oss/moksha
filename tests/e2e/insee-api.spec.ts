/**
 * MOKSHA V7.1 — E2E API SIRET / SIREN (F1.12)
 * Lance contre PW_BASE_URL (prod ou preview) ou démarre Next local.
 * Utilise SIRET réels publics : Apple France 73282932000074, INSEE 12002701600563.
 */

import { test, expect } from '@playwright/test'

// SIRET/SIREN Apple France actuels (vérifiés via recherche-entreprises gouv 2026)
const APPLE_SIRET = '32212091600208'
const APPLE_SIREN = '322120916'
const INSEE_SIRET = '12002701600563'
const INVALID_LUHN_SIRET = '12345678901234'
const NOT_FOUND_SIRET = '99999999999999' // Luhn-valide volontairement (pour 404, pas 400)

test.describe('GET /api/siret/[siret]', () => {
  test('SIRET Apple France valide → 200 avec denomination + adresse', async ({ request }) => {
    const res = await request.get(`/api/siret/${APPLE_SIRET}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.etablissement.siret).toBe(APPLE_SIRET)
    expect(body.etablissement.siren).toBe(APPLE_SIREN)
    expect(body.etablissement.denomination).toMatch(/APPLE/i)
    expect(body.etablissement.code_postal || body.etablissement.adresse?.code_postal).toBeTruthy()
    expect(['insee', 'fallback']).toContain(body.etablissement.source)
  })

  test('SIRET INSEE valide → 200', async ({ request }) => {
    const res = await request.get(`/api/siret/${INSEE_SIRET}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.etablissement.siren).toBe('120027016')
  })

  test('SIRET Luhn invalide → 400', async ({ request }) => {
    const res = await request.get(`/api/siret/${INVALID_LUHN_SIRET}`)
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('invalid_format')
  })

  test('SIRET trop court → 400', async ({ request }) => {
    const res = await request.get('/api/siret/123')
    expect(res.status()).toBe(400)
  })

  test('SIRET inexistant Luhn-valide → 404 ou 200 fallback', async ({ request }) => {
    // Note : un SIRET formellement valide mais inexistant retourne 404 INSEE.
    // Le fallback recherche-entreprises peut éventuellement retourner null aussi → 404.
    const res = await request.get(`/api/siret/${NOT_FOUND_SIRET}`)
    expect([200, 404]).toContain(res.status())
  })

  test('Cache HTTP headers présents sur succès', async ({ request }) => {
    const res = await request.get(`/api/siret/${APPLE_SIRET}`)
    if (res.status() === 200) {
      const cc = res.headers()['cache-control']
      expect(cc).toContain('public')
      expect(cc).toContain('max-age')
    }
  })
})

test.describe('GET /api/siren/[siren]', () => {
  test('SIREN Apple France valide → 200', async ({ request }) => {
    const res = await request.get(`/api/siren/${APPLE_SIREN}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.unite_legale.siren).toBe(APPLE_SIREN)
    expect(body.unite_legale.denomination).toMatch(/APPLE/i)
  })

  test('SIREN Luhn invalide → 400', async ({ request }) => {
    const res = await request.get('/api/siren/123456789')
    expect(res.status()).toBe(400)
  })

  test('SIREN trop court → 400', async ({ request }) => {
    const res = await request.get('/api/siren/123')
    expect(res.status()).toBe(400)
  })
})
