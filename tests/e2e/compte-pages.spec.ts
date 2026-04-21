/**
 * MOKSHA V7.1 — E2E /compte/* (F3.8)
 *
 * Chacune des 7 pages Stripe Connect Embedded est protégée par le middleware :
 * un user non authentifié doit être redirigé vers /auth?next=/compte/<section>.
 * On teste l'accès côté public (état par défaut) — pas le rendu de l'Embedded
 * Component lui-même (nécessite un compte Connect onboardé).
 *
 * On vérifie également que l'API /api/connect/account-session refuse les
 * requêtes non authentifiées avec un 401 + body JSON explicite.
 */

import { test, expect } from '@playwright/test'

const SECTIONS = [
  'notifications',
  'gestion',
  'virements',
  'paiements',
  'soldes',
  'documents',
  'configuration',
] as const

test.describe('Pages /compte/* (Stripe Connect Embedded)', () => {
  for (const section of SECTIONS) {
    test(`/compte/${section} redirige un user non-auth vers /auth`, async ({ page }) => {
      const res = await page.goto(`/compte/${section}`, { waitUntil: 'domcontentloaded' })
      // Le middleware peut retourner soit une redirection serveur (307)
      // soit un rendu HTML après redirect côté client. On valide l'URL finale.
      expect(res).toBeTruthy()
      const finalUrl = new URL(page.url())
      expect(finalUrl.pathname).toBe('/auth')
      expect(finalUrl.searchParams.get('next')).toBe(`/compte/${section}`)
    })
  }
})

test.describe('POST /api/connect/account-session', () => {
  test('refuse 401 si non authentifié', async ({ request }) => {
    const res = await request.post('/api/connect/account-session')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/authentifié/i)
  })
})
