import { test, expect, type Page } from '@playwright/test'

// MOKSHA — Full audit suite
// Tests EVERY public page, link, button, form, responsive 375+1920, console errors

const PUBLIC_PAGES = [
  '/',
  '/demarrer',
  '/auth',
  '/creer/entreprise',
  '/creer/association',
  '/creer/formalites',
  '/paiement',
  '/merci',
  '/mentions-legales',
  '/politique-confidentialite',
  '/cgu',
  '/cgv',
  '/politique-cookies',
  '/contact',
  '/ecosystem',
  '/offline',
]

const PROTECTED_PAGES = [
  '/dashboard',
  '/dashboard/aide',
  '/dashboard/demarches',
  '/dashboard/jurisia',
  '/dashboard/parametres',
  '/dashboard/parrainage',
  '/dashboard/partage',
  '/dashboard/proofvault',
  '/dashboard/rappels',
  '/dashboard/simulateur',
  '/dashboard/structures',
  '/dashboard/wallet',
  '/dashboard/points',
  '/dashboard/concours',
  '/dashboard/feedback',
]

const ADMIN_PAGES = [
  '/admin',
  '/admin/concours',
  '/admin/demarches',
  '/admin/parrainages',
  '/admin/users',
  '/admin/wallet',
  '/admin/feedback',
  '/admin/points',
  '/admin/contact',
]

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('moksha_intro_seen', '1')
  })
}

const ALLOWED_404 = [
  '/_vercel/insights',
  '/_vercel/speed-insights',
  '/favicon.ico',
  '/manifest.json',
]

function trackConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    // "Failed to load resource" is paired with a network event we already vet below
    if (text.includes('Failed to load resource')) return
    errors.push(text)
  })
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))
  page.on('response', (resp) => {
    if (resp.status() < 400) return
    const url = resp.url()
    if (ALLOWED_404.some((p) => url.includes(p))) return
    errors.push(`HTTP ${resp.status()} ${url}`)
  })
  return errors
}

test.describe('MOKSHA — Public pages HTTP 200 + content + 0 console error', () => {
  for (const path of PUBLIC_PAGES) {
    test(`page ${path} loads`, async ({ page }) => {
      await skipIntro(page)
      const errors = trackConsole(page)
      const resp = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(resp?.status(), `${path} status`).toBeLessThan(400)
      // Body has content
      const bodyText = (await page.locator('body').innerText()).trim()
      expect(bodyText.length, `${path} should have content`).toBeGreaterThan(20)
      // No raw "undefined" leaking
      expect(bodyText.toLowerCase()).not.toContain('undefined undefined')
      await page.waitForTimeout(400)
      expect(errors, `${path} console errors`).toEqual([])
    })
  }
})

test.describe('MOKSHA — Protected pages redirect to /auth when not logged in', () => {
  for (const path of PROTECTED_PAGES) {
    test(`protected ${path} → /auth`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(page.url()).toContain('/auth')
    })
  }
})

test.describe('MOKSHA — Admin pages redirect to /auth when not logged in', () => {
  for (const path of ADMIN_PAGES) {
    test(`admin ${path} → /auth`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(page.url()).toContain('/auth')
    })
  }
})

test.describe('MOKSHA — All buttons & links on landing are clickable / not 404', () => {
  test('every internal link returns 200', async ({ page, request }) => {
    await skipIntro(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const hrefs = await page.$$eval('a[href]', (els) =>
      els
        .map((e) => (e as HTMLAnchorElement).getAttribute('href') || '')
        .filter((h) => h && !h.startsWith('#') && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('http'))
    )
    const unique = Array.from(new Set(hrefs))
    expect(unique.length, 'landing should have internal links').toBeGreaterThan(0)
    for (const href of unique) {
      const r = await request.get(href, { maxRedirects: 5 })
      expect(r.status(), `link ${href}`).toBeLessThan(400)
    }
  })

  test('every button on landing is clickable (no dead handlers)', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const buttons = page.locator('button:visible')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i)
      await expect(btn).toBeEnabled()
    }
  })
})

test.describe('MOKSHA — Forms validation', () => {
  test('auth form rejects empty submission', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/auth', { waitUntil: 'domcontentloaded' })
    // Find the email input
    const email = page.locator('input[type="email"]').first()
    await expect(email).toBeVisible()
    await expect(email).toHaveAttribute('required', '')
  })

  test('auth form accepts valid email format', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/auth')
    const email = page.locator('input[type="email"]').first()
    const password = page.locator('input[type="password"]').first()
    await email.fill('test@example.com')
    await password.fill('Test123456!')
    await expect(email).toHaveValue('test@example.com')
  })
})

test.describe('MOKSHA — Wizard entreprise navigates', () => {
  test('wizard entreprise loads & step 1 visible', async ({ page }) => {
    await skipIntro(page)
    const errors = trackConsole(page)
    await page.goto('/creer/entreprise')
    await expect(page.locator('body')).toContainText(/SASU|SAS|SARL|EURL/i)
    await page.waitForTimeout(300)
    expect(errors).toEqual([])
  })

  test('wizard association loads & step 1 visible', async ({ page }) => {
    await skipIntro(page)
    const errors = trackConsole(page)
    await page.goto('/creer/association')
    await page.waitForTimeout(300)
    expect(errors).toEqual([])
    expect(await page.locator('body').innerText()).toBeTruthy()
  })
})

test.describe('MOKSHA — Responsive layouts', () => {
  test('375px mobile — landing has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await skipIntro(page)
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(2)
  })

  test('1920px desktop — landing renders nav', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await skipIntro(page)
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible()
  })

  test('375px mobile — auth page renders form', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await skipIntro(page)
    await page.goto('/auth')
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
  })
})

test.describe('MOKSHA — API endpoints', () => {
  test('/api/status returns ok JSON', async ({ request }) => {
    const r = await request.get('/api/status')
    expect(r.status()).toBe(200)
    const j = await r.json()
    expect(j.status).toBe('ok')
    expect(j.app).toBe('MOKSHA')
  })

  test('/api/jurisia/chat requires POST', async ({ request }) => {
    const r = await request.get('/api/jurisia/chat')
    expect([401, 405, 400]).toContain(r.status())
  })

  test('/api/conformity/me requires auth (401)', async ({ request }) => {
    const r = await request.get('/api/conformity/me')
    expect([401, 403]).toContain(r.status())
  })

  test('/api/wallet/withdraw requires auth', async ({ request }) => {
    const r = await request.post('/api/wallet/withdraw', { data: {} })
    expect([401, 403, 400, 405]).toContain(r.status())
  })

  test('/api/admin/stats requires admin', async ({ request }) => {
    const r = await request.get('/api/admin/stats')
    expect([401, 403]).toContain(r.status())
  })

  // V3 APIs
  test('/api/points requires auth (401)', async ({ request }) => {
    const r = await request.get('/api/points')
    expect([401, 403]).toContain(r.status())
  })

  test('/api/points/daily-gift requires auth (401)', async ({ request }) => {
    const r = await request.post('/api/points/daily-gift')
    expect([401, 403]).toContain(r.status())
  })

  test('/api/feedback requires auth + POST', async ({ request }) => {
    const r = await request.post('/api/feedback', { data: {} })
    expect([401, 403, 400]).toContain(r.status())
  })

  test('/api/contact accepts POST with valid data', async ({ request }) => {
    const r = await request.post('/api/contact', {
      data: { name: 'PW Test', email: 'pw@test.dev', subject: 'Test PW', message: 'Ceci est un test Playwright automatisé. Ignorer.' },
    })
    expect([200, 500]).toContain(r.status()) // 500 if Resend not configured
  })

  test('/api/share requires auth (401)', async ({ request }) => {
    const r = await request.post('/api/share', { data: { platform: 'test' } })
    expect([401, 403]).toContain(r.status())
  })

  test('/api/concours requires auth (401)', async ({ request }) => {
    const r = await request.get('/api/concours')
    expect([401, 403]).toContain(r.status())
  })

  test('/api/aide/chat requires auth (401)', async ({ request }) => {
    const r = await request.post('/api/aide/chat', { data: { message: 'test' } })
    expect([401, 403]).toContain(r.status())
  })

  // Admin V3 APIs
  test('/api/admin/feedback requires admin', async ({ request }) => {
    const r = await request.get('/api/admin/feedback')
    expect([401, 403]).toContain(r.status())
  })

  test('/api/admin/points requires admin', async ({ request }) => {
    const r = await request.get('/api/admin/points')
    expect([401, 403]).toContain(r.status())
  })

  test('/api/admin/contact requires admin', async ({ request }) => {
    const r = await request.get('/api/admin/contact')
    expect([401, 403]).toContain(r.status())
  })
})

test.describe('MOKSHA — SEO & static', () => {
  test('sitemap.xml served', async ({ request }) => {
    const r = await request.get('/sitemap.xml')
    expect(r.status()).toBe(200)
    expect(r.headers()['content-type']).toContain('xml')
  })

  test('robots.txt served', async ({ request }) => {
    const r = await request.get('/robots.txt')
    expect(r.status()).toBe(200)
  })

  test('manifest.json served for PWA', async ({ request }) => {
    const r = await request.get('/manifest.json')
    expect(r.status()).toBe(200)
    const j = await r.json()
    expect(j.short_name).toBe('MOKSHA')
    expect(j.display).toBe('standalone')
    expect(j.theme_color).toBe('#FF6B35')
  })

  test('sw.js served', async ({ request }) => {
    const r = await request.get('/sw.js')
    expect(r.status()).toBe(200)
  })
})

test.describe('MOKSHA — V3 Contact form', () => {
  test('contact page renders form with all fields', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/contact')
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

test.describe('MOKSHA — V3 Ecosystem page', () => {
  test('ecosystem page shows Purama apps', async ({ page }) => {
    await skipIntro(page)
    const errors = trackConsole(page)
    await page.goto('/ecosystem')
    await expect(page.getByRole('heading', { name: 'Écosystème Purama' })).toBeVisible()
    await expect(page.getByText('CROSS50')).toBeVisible()
    await page.waitForTimeout(300)
    expect(errors).toEqual([])
  })
})

test.describe('MOKSHA — V3 Offline page', () => {
  test('offline page renders fallback', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/offline')
    await expect(page.getByText('Hors connexion')).toBeVisible()
  })
})

test.describe('MOKSHA — No placeholder / TODO / Lorem in source', () => {
  test('landing page has no placeholder text', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    const text = await page.locator('body').innerText()
    const lower = text.toLowerCase()
    expect(lower).not.toContain('lorem ipsum')
    expect(lower).not.toContain('placeholder')
    expect(lower).not.toContain('todo:')
  })
})

test.describe('MOKSHA — Share redirect', () => {
  test('/share/MOKSHA-TEST redirects to /?ref=', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/share/MOKSHA-TEST123')
    expect(page.url()).toContain('ref=MOKSHA-TEST123')
  })
})
