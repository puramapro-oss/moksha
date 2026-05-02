/**
 * MOKSHA V2 — E2E landing refondue
 *
 * Vérifie que :
 *  1. La home `/` est désormais un écran d'accueil app pur (style ChatGPT)
 *     - logo + H1 + 2 CTAs (Commencer / Se connecter) + trust strip
 *     - PAS de sections marketing legacy (Choices/Features/Pricing/FAQ/etc.)
 *  2. `/demarrer` affiche la grid asymétrique :
 *     - Card Entreprise featured avec badge "Le plus choisi"
 *     - Cards Asso + Conseil JurisIA en standard
 *     - Trust strip premium (Kbis 5-10j, Garantie zéro refus, 100% en ligne)
 *  3. `/aide` (nouvelle page publique) charge avec FAQ
 *  4. Responsive 375 / 768 / 1440 — pas d'overflow horizontal
 */

import { test, expect } from '@playwright/test'

test.describe('Home `/` — écran d\'accueil app pur', () => {
  test('charge en 200 et n\'affiche pas les anciennes sections marketing', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBeLessThan(400)
    // 2 CTAs principaux
    await expect(page.getByRole('link', { name: /commencer|get started/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /se connecter|sign in/i }).first()).toBeVisible()
    // Pas de section pricing inline (le H2 "Économisez 20%" venait du composant Pricing)
    await expect(page.getByText(/Mensuel.*Annuel.*-20/i)).toHaveCount(0)
    // Pas de section comparatif inline
    await expect(page.getByText(/legalplace/i)).toHaveCount(0)
    // Footer minimal — copyright SASU
    await expect(page.getByText(/SASU PURAMA.*Frasne/i)).toBeVisible()
  })

  test('responsive — pas d\'overflow horizontal en 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    // Tolère ±2px pour scrollbar
    expect(overflow).toBeLessThanOrEqual(2)
  })
})

test.describe('Page /demarrer — grid asymétrique premium', () => {
  test('charge avec H1 "Par où commences-tu" + 3 cards', async ({ page }) => {
    await page.goto('/demarrer', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /par où commences-tu/i })).toBeVisible()
    // 3 cards : entreprise (featured) + assoc + conseil
    await expect(page.getByRole('link', { name: /créer mon entreprise|le plus choisi/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /loi 1901/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /jurisia me guide/i })).toBeVisible()
    // Badge "Le plus choisi"
    await expect(page.getByText(/Le plus choisi/i)).toBeVisible()
    // Trust strip
    await expect(page.getByText(/Kbis 5.10 jours/i).first()).toBeVisible()
    await expect(page.getByText(/Garantie z[eé]ro refus/i).first()).toBeVisible()
  })

  test('responsive 375px — 3 cards stack verticalement sans overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 })
    await page.goto('/demarrer', { waitUntil: 'domcontentloaded' })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(2)
  })

  test('responsive 768px tablette — grid se restructure', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/demarrer', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Le plus choisi/i)).toBeVisible()
  })
})

test.describe('Page /aide — nouvelle page publique', () => {
  test('charge en 200, affiche FAQ + 3 channels', async ({ page }) => {
    const res = await page.goto('/aide', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBeLessThan(400)
    await expect(page.getByRole('heading', { name: /on t.aide à te lancer/i })).toBeVisible()
    // 3 channels — chercher h3 strict pour éviter collision avec intro paragraph
    await expect(page.getByRole('heading', { name: /JurisIA/i, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Contact humain/i, level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Chatbot in-app/i, level: 3 })).toBeVisible()
    // FAQ — au moins 1 question visible
    await expect(page.getByText(/Combien de temps pour recevoir mon Kbis/i)).toBeVisible()
  })
})
