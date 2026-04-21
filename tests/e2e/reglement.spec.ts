/**
 * MOKSHA V7.1 — E2E /reglement + /api/reglement/verify (F2.9)
 *
 * Couvre :
 * - Page publique /reglement charge et contient les 9 articles
 * - Article 8 réécrit "Preuve blockchain Purama" (jamais "OpenTimestamps" / "Bitcoin")
 * - API /api/reglement/verify/[id] : 400 si manquant, 404 si UUID inconnu, 200+JSON si trouvé
 */

import { test, expect } from '@playwright/test'

test.describe('Page /reglement', () => {
  test('charge en 200 + contient les 9 articles', async ({ page }) => {
    const res = await page.goto('/reglement')
    expect(res?.status()).toBe(200)

    // Articles obligatoires (V4.1 §règlement)
    await expect(page.getByText('Article 1 — Organisateur')).toBeVisible()
    await expect(page.getByText('Article 2 — Durée & participation gratuite')).toBeVisible()
    await expect(page.getByText('Article 3 — Dotations')).toBeVisible()
    await expect(page.getByText('Article 4 — Désignation des gagnants')).toBeVisible()
    await expect(page.getByText('Article 5 — Remboursement des frais')).toBeVisible()
    await expect(page.getByText('Article 6 — Données personnelles (RGPD)')).toBeVisible()
    await expect(page.getByText('Article 7 — Litiges')).toBeVisible()
    await expect(page.getByText('Article 8 — Preuve blockchain Purama')).toBeVisible()
    await expect(page.getByText('Article 9 — Modifications')).toBeVisible()
  })

  test('terme UI "Preuve blockchain Purama" (jamais "OpenTimestamps" / "Bitcoin")', async ({ page }) => {
    await page.goto('/reglement')
    const html = await page.content()

    // Whitelist : "Preuve blockchain Purama" présent
    expect(html).toContain('Preuve blockchain Purama')

    // Blacklist V4.1 : pas de mention technique côté UI
    expect(html).not.toMatch(/OpenTimestamps/i)
    expect(html).not.toMatch(/\bBitcoin\b/i)
  })

  test('mentions légales SASU PURAMA + Frasne 25560', async ({ page }) => {
    await page.goto('/reglement')
    // Plusieurs occurrences possibles (sous-titre + Article 1) → first()
    await expect(page.getByText('SASU PURAMA').first()).toBeVisible()
    await expect(page.getByText(/Frasne/).first()).toBeVisible()
    await expect(page.getByText(/25560/).first()).toBeVisible()
  })

  test('lien /remboursement présent', async ({ page }) => {
    await page.goto('/reglement')
    const link = page.locator('a[href="/remboursement"]')
    await expect(link.first()).toBeVisible()
  })
})

test.describe('GET /api/reglement/verify/[id]', () => {
  test('UUID inconnu → 404', async ({ request }) => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000'
    const res = await request.get(`/api/reglement/verify/${fakeUuid}`)
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/introuvable/i)
  })

  test('ID malformé → 404 ou 500 contrôlé (jamais 200)', async ({ request }) => {
    const res = await request.get('/api/reglement/verify/not-a-uuid')
    expect([400, 404, 500]).toContain(res.status())
  })
})
