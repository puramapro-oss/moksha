import { test, expect } from '@playwright/test'

test.describe('MOKSHA — Cinematic intro + i18n (16 languages)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('cinematic intro shows on first visit and disappears (skip)', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem('moksha_intro_seen'))
    await page.goto('/')
    const intro = page.getByTestId('cinematic-intro')
    await expect(intro).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/MOKSHA/i).first()).toBeVisible()
    await page.getByTestId('intro-skip').click()
    await expect(intro).toBeHidden({ timeout: 4_000 })
    const seen = await page.evaluate(() => window.localStorage.getItem('moksha_intro_seen'))
    expect(seen).toBe('1')
  })

  test('intro NOT shown on second visit (localStorage flag)', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('moksha_intro_seen', '1'))
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByTestId('cinematic-intro')).toHaveCount(0)
  })

  test('default locale FR — landing renders French copy', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('moksha_intro_seen', '1'))
    await page.goto('/')
    await expect(page.getByRole('navigation').getByText('Fonctionnalités').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Libère-toi/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Se libérer maintenant/i })).toBeVisible()
  })

  test('language switcher → English: nav + hero in English', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('moksha_intro_seen', '1'))
    await page.goto('/')
    await page.getByRole('button', { name: /Langue|Language/i }).first().click()
    await page.getByTestId('lang-en').click()
    await expect(page.getByRole('navigation').getByText('Features').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('heading', { name: /Free yourself/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Free yourself now/i })).toBeVisible()
  })

  test('language persists across reload (cookie)', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('moksha_intro_seen', '1'))
    await page.goto('/')
    await page.getByRole('button', { name: /Langue|Language/i }).first().click()
    await page.getByTestId('lang-de').click()
    await expect(page.getByText(/Jetzt befreien/i)).toBeVisible({ timeout: 8_000 })
    await page.reload()
    await expect(page.getByText(/Jetzt befreien/i)).toBeVisible()
  })

  test('Arabic locale sets dir=rtl on <html>', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('moksha_intro_seen', '1'))
    await page.goto('/')
    await page.getByRole('button', { name: /Langue|Language/i }).first().click()
    await page.getByTestId('lang-ar').click()
    await expect(page.getByText(/تحرّر الآن/)).toBeVisible({ timeout: 8_000 })
    const dir = await page.locator('html').getAttribute('dir')
    expect(dir).toBe('rtl')
  })

  test('all 16 locales selectable in switcher', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('moksha_intro_seen', '1'))
    await page.goto('/')
    await page.getByRole('button', { name: /Langue|Language/i }).first().click()
    const langs = ['fr','en','es','de','it','pt','ar','zh','ja','ko','hi','ru','tr','nl','pl','sv']
    for (const l of langs) {
      await expect(page.getByTestId(`lang-${l}`)).toBeVisible()
    }
  })
})
